import * as React from 'react';

import { UnderlinedHeader } from '../../common-elements';

import { ShelfIcon } from '../../common-elements/shelfs';

import { PropertiesTable } from '../../common-elements/fields-layout';

import { FieldModel } from '../../services/models';
import { Field } from '../Fields/Field';

import { mapWithLast } from '../../utils';

import { OptionsContext } from '../OptionsProvider';
import { ScopesContext } from '../ScopesDlg/ScopesContext';

export interface ParametersGroupProps {
  place: string;
  parameters: FieldModel[];
}

export class ParametersGroup extends React.PureComponent<ParametersGroupProps, any> {
  static contextType = ScopesContext;

  state = { expanded: false };
  toggle = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  // How many of the parameters are visible ??
  countVisibleParameters(ctx: ScopesContext) {
    return this.getVisibleParameters(ctx).length;
  };

  getVisibleParameters(ctx: ScopesContext) {
    return this.props.parameters.filter(param =>{

      // No scopes defined means no hidden operations...
      if (Object.keys(ctx.scopes).length == 0) {
        return true;
      }
  
      // If the field is marked with x-deferred... then use the DEFERRED scope to decide
      if(param.schema.deferred) {
        return ctx.scopes['DEFERRED'];
      }
  
      // Are we doing long-form URLs ??
      if(ctx.longURLs) {
        return ! (param.longFormURL !== undefined && ! param.longFormURL);
      }
  
      // We're doing short-form URLs
      return ! (param.longFormURL !== undefined && param.longFormURL);

    });
  }
  // Is even one paramater visible ??
  hasVisibleParameters(ctx: ScopesContext){
    return this.props.parameters.some(param => {
      // No scopes defined means no hidden operations...
      if (Object.keys(ctx.scopes).length == 0) {
        return true;
      }
  
      // If the field is marked with x-deferred... then use the DEFERRED scope to decide
      if(param.schema.deferred) {
        return ctx.scopes['DEFERRED'];
      }
  
      // Are we doing long-form URLs ??
      if(ctx.longURLs) {
        return ! (param.longFormURL !== undefined && ! param.longFormURL);
      }
  
      // We're doing short-form URLs
      return ! (param.longFormURL !== undefined && param.longFormURL);
    });
  }

  render() {
    const { place, parameters } = this.props;

    // If there's no parameters (or they're all hidden) then nothing to show
    if (!parameters || !parameters.length || ! this.hasVisibleParameters(this.context)) {
      return null;
    }

    return (
        <OptionsContext.Consumer>
            {options => (             
                <div key={place}>
                  <UnderlinedHeader onClick={this.toggle}>
                    {place} Parameters{' '}
                    {parameters.length > options.parameterGroupCollapseThreshold && (
                      <ShelfIcon direction={this.state.expanded ? 'down' : 'right'} />
                    )}
                    {' ('}
                    {this.countVisibleParameters(this.context)}
                    {')'}
                  </UnderlinedHeader>
                  {(this.state.expanded ||
                    parameters.length <= options.parameterGroupCollapseThreshold) && (
                    <PropertiesTable>
                      <tbody>
                        {mapWithLast(this.getVisibleParameters(this.context), (field, isLast) => (
                          <Field key={field.name} isLast={isLast} field={field} showExamples={true} />
                        ))}
                      </tbody>
                    </PropertiesTable>
                  )}
                </div>)}
      </OptionsContext.Consumer> );
  }
}
