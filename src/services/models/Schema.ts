import { action, observable } from 'mobx';

import { OpenAPIDictionary, OpenAPIExternalDocumentation, OpenAPISchema, Referenced } from '../../types';

import { OpenAPIParser } from '../OpenAPIParser';
import { RedocNormalizedOptions } from '../RedocNormalizedOptions';
import { FieldModel } from './Field';

import { MergedOpenAPISchema } from '../';
import {
  detectType,
  extractExtensions,
  humanizeConstraints,
  isNamedDefinition,
  isPrimitiveType,
  JsonPointer,
  pluralizeType,
  sortByField,
  sortByRequired,
} from '../../utils/';

import { l } from '../Labels';

// TODO: refactor this model, maybe use getters instead of copying all the values
export class SchemaModel {
  pointer: string;

  type: string;
  displayType: string;
  typePrefix: string = '';
  title: string;
  titleStar: OpenAPIDictionary;
  description: string;
  descriptionStar: OpenAPIDictionary;
  externalDocs?: OpenAPIExternalDocumentation;

  isPrimitive: boolean;
  isCircular: boolean = false;

  format?: string;
  displayFormat?: string;
  nullable: boolean;
  deprecated: boolean;
  deferred: boolean;
  pattern?: string;
  example?: any;
  enum: any[];
  const: any;
  default?: any;
  readOnly: boolean;
  writeOnly: boolean;

  constraints: string[];

  fields?: FieldModel[];
  items?: SchemaModel;

  oneOf?: SchemaModel[];
  oneOfType: string;
  discriminatorProp: string;
  @observable
  activeOneOf: number = 0;

  @observable
  oneOfTruncated: boolean = true;

  rawSchema: OpenAPISchema;
  schema: MergedOpenAPISchema;
  extensions?: Dict<any>;

  /**
   * @param isChild if schema discriminator Child
   * When true forces dereferencing in allOfs even if circular
   */
  constructor(
    parser: OpenAPIParser,
    schemaOrRef: Referenced<OpenAPISchema> & { description?: string },
    pointer: string,
    private options: RedocNormalizedOptions,
    isChild: boolean = false,
  ) {
    this.pointer = schemaOrRef.$ref || pointer || '';
    this.rawSchema = parser.deref(schemaOrRef);
    this.schema = parser.mergeAllOf(this.rawSchema, this.pointer, isChild);

    this.init(parser, isChild, parser.isRef(schemaOrRef));

    parser.exitRef(schemaOrRef);
    parser.exitParents(this.schema);

    // We'll need some extensions ... 
    if (options.showExtensions) {
      this.extensions = extractExtensions(this.schema, options.showExtensions);
    }

    // If we've got defaultLanguage and 'title*' or 'description*' translation maps, 
    //    then set the title and description fields using the default language string
    // PS:  We're overwriting any pre-existing 'title' or 'description'
    if (options.defaultLanguage && this.titleStar[options.defaultLanguage]) {
      this.title = this.titleStar[options.defaultLanguage];
    }
    if (options.defaultLanguage && this.descriptionStar[options.defaultLanguage]) {
      this.description = this.descriptionStar[options.defaultLanguage];
    }

    // If we've got a ref - we might have to 'overload' what we got from the $ref with sibling fields (as a kind of implied 'allOf')
    if (parser.isRef(schemaOrRef)) {

      if (schemaOrRef.description)
        this.description = schemaOrRef.description;

      if (schemaOrRef['x-deferred'])
        this.deferred = !!schemaOrRef['x-deferred'];
    }
  }

  /**
   * Set specified alternative schema as active
   * @param idx oneOf index
   */
  @action
  activateOneOf(idx: number) {
    this.activeOneOf = idx;
  }

  @action
  truncateOneOf(val: boolean) {
    this.oneOfTruncated = val;
  }

  init(parser: OpenAPIParser, isChild: boolean, isRef: boolean) {
    const schema = this.schema;
    this.isCircular = schema['x-circular-ref'];

    this.title =
      schema.title || (isNamedDefinition(this.pointer) && JsonPointer.baseName(this.pointer)) || '';
    this.titleStar = schema['title*'] || {};
    this.description = schema.description || '';
    this.descriptionStar = schema['description*'] || {};
    this.type = schema.type || detectType(schema);
    this.format = schema.format;
    this.nullable = !!schema.nullable;
    this.enum = schema.enum || [];
    this.const = schema.const;
    this.example = schema.example;
    this.deprecated = !!schema.deprecated;
    if (!isRef) {
      this.deferred = !!schema['x-deferred'];
    } else {
      this.deferred = false;
    }
    this.pattern = schema.pattern;
    this.externalDocs = schema.externalDocs;

    this.constraints = humanizeConstraints(schema);
    this.displayType = this.type;
    this.displayFormat = this.format;
    this.isPrimitive = isPrimitiveType(schema, this.type);
    this.default = schema.default;
    this.readOnly = !!schema.readOnly;
    this.writeOnly = !!schema.writeOnly;

    if (this.isCircular) {
      return;
    }

    if (!isChild && getDiscriminator(schema) !== undefined) {
      this.initDiscriminator(schema, parser);
      return;
    } else if (
      isChild &&
      Array.isArray(schema.oneOf) &&
      schema.oneOf.find(s => s.$ref === this.pointer)
    ) {
      // we hit allOf of the schema with the parent discriminator
      delete schema.oneOf;
    }

    if (schema.oneOf !== undefined) {
      this.initOneOf(schema.oneOf, parser);
      this.oneOfType = 'One of';
      if (schema.anyOf !== undefined) {
        console.warn(
          `oneOf and anyOf are not supported on the same level. Skipping anyOf at ${this.pointer}`,
        );
      }
      return;
    }

    if (schema.anyOf !== undefined) {
      this.initOneOf(schema.anyOf, parser);
      this.oneOfType = 'Any of';
      return;
    }

    if (this.type === 'object') {
      this.fields = buildFields(parser, schema, this.pointer, this.options);
    } else if (this.type === 'array' && schema.items) {
      this.items = new SchemaModel(parser, schema.items, this.pointer + '/items', this.options);
      this.displayType = pluralizeType(this.items.displayType);
      this.displayFormat = this.items.format;
      this.typePrefix = this.items.typePrefix + l('arrayOf');
      this.title = this.title || this.items.title;
      this.isPrimitive = this.items.isPrimitive;
      if (this.example === undefined && this.items.example !== undefined) {
        this.example = [this.items.example];
      }
      if (this.items.isPrimitive) {
        this.enum = this.items.enum;
      }
    }
  }

  private initOneOf(oneOf: OpenAPISchema[], parser: OpenAPIParser) {
    this.oneOf = oneOf!.map((variant, idx) => {
      const derefVariant = parser.deref(variant);

      const merged = parser.mergeAllOf(derefVariant, this.pointer + '/oneOf/' + idx);

      // try to infer title
      var title =
        isNamedDefinition(variant.$ref) && !merged.title
          ? JsonPointer.baseName(variant.$ref)
          : merged.title;

      const schema = new SchemaModel(
        parser,
        // merge base schema into each of oneOf's subschemas
        {
          // variant may already have allOf so merge it to not get overwritten
          ...merged,
          title,
          description: merged.description,  // don't pull description down from parent
          allOf: [{ ...this.schema, oneOf: undefined, anyOf: undefined }],
        } as OpenAPISchema,
        this.pointer + '/oneOf/' + idx,
        this.options,
      );

      parser.exitRef(variant);
      // each oneOf should be independent so exiting all the parent refs
      // otherwise it will cause false-positive recursive detection
      parser.exitParents(merged);

      return schema;
    });
    // If the displayType hasn't been defined, then assemble an aggregate
    // displayType from all the oneOf variants
    if (this.displayType === 'any') {
      this.displayType = this.oneOf
        .map(schema => {
          let name =
            schema.typePrefix +
            (schema.title ? `${schema.title} (${schema.displayType})` : schema.displayType);
          if (name.indexOf(' or ') > -1) {
            name = `(${name})`;
          }
          return name;
        })
        .join(' or ');
    }
  }

  private initDiscriminator(
    schema: OpenAPISchema & {
      parentRefs?: string[];
    },
    parser: OpenAPIParser,
  ) {
    const discriminator = getDiscriminator(schema)!;
    this.discriminatorProp = discriminator.propertyName;
    const implicitInversedMapping = parser.findDerived([
      ...(schema.parentRefs || []),
      this.pointer,
    ]);

    if (schema.oneOf) {
      for (const variant of schema.oneOf) {
        if (variant.$ref === undefined) {
          continue;
        }
        const name = JsonPointer.baseName(variant.$ref);
        implicitInversedMapping[variant.$ref] = name;
      }
    }

    const mapping = discriminator.mapping || {};
    const explicitInversedMapping = {};
    for (const name in mapping) {
      const $ref = mapping[name];

      if (Array.isArray(explicitInversedMapping[$ref])) {
        explicitInversedMapping[$ref].push(name);
      } else {
        // overrides implicit mapping here
        explicitInversedMapping[$ref] = [name];
      }
    }

    const inversedMapping = { ...implicitInversedMapping, ...explicitInversedMapping };

    const refs: Array<{ $ref; name }> = [];

    for (const $ref of Object.keys(inversedMapping)) {
      const names = inversedMapping[$ref];
      if (Array.isArray(names)) {
        for (const name of names) {
          refs.push({ $ref, name });
        }
      } else {
        refs.push({ $ref, name: names });
      }
    }

    this.oneOf = refs.map(({ $ref, name }) => {
      const innerSchema = new SchemaModel(parser, parser.byRef($ref)!, $ref, this.options, true);
      innerSchema.title = name;
      return innerSchema;
    });
  }
}

function buildFields(
  parser: OpenAPIParser,
  schema: OpenAPISchema,
  $ref: string,
  options: RedocNormalizedOptions,
): FieldModel[] {
  const props = schema.properties || {};
  const additionalProps = schema.additionalProperties;
  const defaults = schema.default || {};
  let fields = Object.keys(props || []).map(fieldName => {
    let field = props[fieldName];

    if (!field) {
      console.warn(
        `Field "${fieldName}" is invalid, skipping.\n Field must be an object but got ${typeof field} at "${$ref}"`,
      );
      field = {};
    }

    const required =
      schema.required === undefined ? false : schema.required.indexOf(fieldName) > -1;

    return new FieldModel(
      parser,
      {
        name: fieldName,
        required,
        schema: {
          ...field,
          default: field.default === undefined ? defaults[fieldName] : field.default,
        },
      },
      $ref + '/properties/' + fieldName,
      options,
    );
  });

  if (options.sortPropsAlphabetically) {
    fields = sortByField(fields, 'name');
  }
  if (options.requiredPropsFirst) {
    // if not sort alphabetically sort in the order from required keyword
    fields = sortByRequired(fields, !options.sortPropsAlphabetically ? schema.required : undefined);
  }

  if (typeof additionalProps === 'object' || additionalProps === true) {
    fields.push(
      new FieldModel(
        parser,
        {
          name: (typeof additionalProps === 'object'
            ? additionalProps['x-additionalPropertiesName'] || 'property name'
            : 'property name'
          ).concat('*'),
          required: false,
          schema: additionalProps === true ? {} : additionalProps,
          kind: 'additionalProperties',
        },
        $ref + '/additionalProperties',
        options,
      ),
    );
  }

  return fields;
}

function getDiscriminator(schema: OpenAPISchema): OpenAPISchema['discriminator'] {
  return schema.discriminator || schema['x-discriminator'];
}
