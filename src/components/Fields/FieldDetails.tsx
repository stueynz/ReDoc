import * as React from 'react';

import {
  NullableLabel,
  PatternLabel,
  RecursiveLabel,
  TypeFormat,
  TypeName,
  TypePrefix,
  TypeTitle,
  MultiLingualLabels
} from '../../common-elements/fields';
import { serializeParameterValue } from '../../utils/openapi';
import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { Markdown } from '../Markdown/Markdown';
import { EnumValues } from './EnumValues';
import { Extensions } from './Extensions';
import { FieldProps } from './Field';
import { ConstraintsView } from './FieldContstraints';
import { FieldDetail } from './FieldDetail';
import { Badge } from '../../common-elements/';

import { l } from '../../services/Labels';
import { RedocNormalizedOptions } from '../../services';
import { OptionsContext } from '../OptionsProvider';
import { isEmpty } from 'lodash';

export class FieldDetails extends React.PureComponent<FieldProps> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;
  render() {
    const { showExamples, field, renderDiscriminatorSwitch } = this.props;
    const { enumSkipQuotes, hideSchemaTitles } = this.context;

    const { schema, description, example, deprecated } = field;

    const rawDefault = !!enumSkipQuotes || field.in === 'header'; // having quotes around header field default values is confusing and inappropriate

    let exampleField: JSX.Element | null = null;

    if (showExamples && example !== undefined) {
      const label = l('example') + ':';
      if (field.in && (field.style || field.serializationMime)) {
        // decode for better readability in examples: see https://github.com/Redocly/redoc/issues/1138
        const serializedValue = decodeURIComponent(serializeParameterValue(field, example));
        exampleField = <FieldDetail label={label} value={serializedValue} raw={true} />;
      } else {
        exampleField = <FieldDetail label={label} value={example} />;
      }
    }

    return (
      <div>
        <div>
          <TypePrefix>{schema.typePrefix}</TypePrefix>
          {!schema.const && <TypeName>{schema.displayType}</TypeName>}
          {schema.displayFormat && (
            <TypeFormat>
              {' '}
              &lt;
              {schema.displayFormat}
              &gt;{' '}
            </TypeFormat>
          )}
          {isEmpty(schema.titleStar) && schema.title && !hideSchemaTitles && <TypeTitle> ({schema.title}) </TypeTitle>}
          {schema.const && <FieldDetail label={l('enumSingleValue') + ':'} value={schema.const} />}
          <ConstraintsView constraints={schema.constraints} />
          {Object.keys(schema.titleStar).length > 0 && !hideSchemaTitles && (
            <div>
              <NullableLabel>Title:</NullableLabel>
              <MultiLingualLabels>
                {Object.keys(schema.titleStar).map(lang => (
                  <li>
                    <span>
                      <NullableLabel> {lang} </NullableLabel>
                      <TypeTitle> {schema.titleStar[lang]} </TypeTitle>
                    </span>
                  </li>
                ))}
              </MultiLingualLabels>
            </div>
          )}
          {schema.nullable && <NullableLabel> {l('nullable')} </NullableLabel>}
          {schema.pattern && <PatternLabel> {schema.pattern} </PatternLabel>}
          {schema.isCircular && <RecursiveLabel> {l('recursive')} </RecursiveLabel>}
        </div>
        {deprecated && (
          <div>
            <Badge type="warning"> {l('deprecated')} </Badge>
          </div>
        )}
        <FieldDetail raw={rawDefault} label={l('default') + ':'} value={schema.default} />
        {!renderDiscriminatorSwitch && <EnumValues type={schema.type} values={schema.enum} />}{' '}
        {exampleField}
        {isEmpty(schema.descriptionStar) &&
          <div>
            <Markdown compact={true} source={description} />
          </div>
        }
        {schema.externalDocs && (
          <ExternalDocumentation externalDocs={schema.externalDocs} compact={true} />
        )}
        {Object.keys(schema.descriptionStar).length > 0 && (
          <div>
            <NullableLabel>Description:</NullableLabel>
            <MultiLingualLabels>
              {Object.keys(schema.descriptionStar).map(lang => (
                <li>
                  <span>
                    <NullableLabel> {lang} </NullableLabel>
                    <TypeTitle> {schema.descriptionStar[lang]} </TypeTitle>
                  </span>
                </li>
              ))}
            </MultiLingualLabels>
          </div>
        )}
        {<Extensions extensions={{ ...field.extensions, ...schema.extensions }} />}
        {(renderDiscriminatorSwitch && renderDiscriminatorSwitch(this.props)) || null}
      </div>
    );
  }
}
