import { observer } from 'mobx-react';
import * as React from 'react';

import { SchemaModel } from '../../services/models';

import { PropertiesTable, PropertiesTableCaption } from '../../common-elements/fields-layout';
import { Field } from '../Fields/Field';
import { DiscriminatorDropdown } from './DiscriminatorDropdown';
import { SchemaProps } from './Schema';

import { mapWithLast } from '../../utils';
import { OptionsContext } from '../OptionsProvider';
import { ScopesContext} from '../ScopesDlg/ScopesContext';

export interface ObjectSchemaProps extends SchemaProps {
  discriminator?: {
    fieldName: string;
    parentSchema: SchemaModel;
  };
}

@observer
export class ObjectSchema extends React.Component<ObjectSchemaProps> {
  static contextType = ScopesContext;

  get parentSchema() {
    return this.props.discriminator!.parentSchema;
  }

  render() {
    const {
      schema: { fields = [] },
      showTitle,
      discriminator,
    } = this.props;

    const needFilter = this.props.skipReadOnly || this.props.skipWriteOnly || Object.keys(this.context.scopes).length != 0;

    const filteredFields = needFilter
      ? fields.filter(item => {
          return !(
            (this.props.skipReadOnly && item.schema.readOnly) ||
            (this.props.skipWriteOnly && item.schema.writeOnly) ||

            (this.context.longURLs &&  item.schema.altURLReference)    // We're doing longURLs and this field is represented in the URL...
          );
        })
      : fields;

    return (
      <OptionsContext.Consumer>
      {options => ( 
        <PropertiesTable>
          {showTitle && <PropertiesTableCaption>{this.props.schema.title}</PropertiesTableCaption>}
          <tbody>
            {mapWithLast(filteredFields, (field, isLast) => {
              return (
                <Field
                  key={field.name}
                  isLast={isLast}
                  field={field}
                  expandByDefault={options.expandSingleSchemaField && filteredFields.length === 1}
                  renderDiscriminatorSwitch={
                    (discriminator &&
                      discriminator.fieldName === field.name &&
                      (() => (
                        <DiscriminatorDropdown
                          parent={this.parentSchema}
                          enumValues={field.schema.enum}
                        />
                      ))) ||
                    undefined
                  }
                  className={field.expanded ? 'expanded' : undefined}
                  showExamples={false}
                  skipReadOnly={this.props.skipReadOnly}
                  skipWriteOnly={this.props.skipWriteOnly}
                  showTitle={this.props.showTitle}
                />
              );
            })}
          </tbody>
        </PropertiesTable>)}
      </OptionsContext.Consumer>
    );
  }
}
