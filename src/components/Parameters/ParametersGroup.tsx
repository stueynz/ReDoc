import * as React from 'react';

import { UnderlinedHeader } from '../../common-elements';

import { ShelfIcon } from '../../common-elements/shelfs';

import { PropertiesTable } from '../../common-elements/fields-layout';

import { FieldModel } from '../../services/models';
import { Field } from '../Fields/Field';

import { mapWithLast } from '../../utils';

import { RedocNormalizedOptions } from '../../services';
import { OptionsContext } from '../OptionsProvider';

export interface ParametersGroupProps {
  place: string;
  parameters: FieldModel[];
}

export class ParametersGroup extends React.PureComponent<ParametersGroupProps, any> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;

  state = { expanded: false };
  toggle = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    const { place, parameters } = this.props;
    if (!parameters || !parameters.length) {
      return null;
    }

    return (
      <div key={place}>
        <UnderlinedHeader onClick={this.toggle}>
          {place} Parameters{' '}
          {parameters.length > this.context.parameterGroupCollapseThreshold && (
            <ShelfIcon direction={this.state.expanded ? 'down' : 'right'} />
          )}
          {' ('}
          {parameters.length}
          {')'}
        </UnderlinedHeader>
        {(this.state.expanded ||
          parameters.length <= this.context.parameterGroupCollapseThreshold) && (
          <PropertiesTable>
            <tbody>
              {mapWithLast(parameters, (field, isLast) => (
                <Field key={field.name} isLast={isLast} field={field} showExamples={true} />
              ))}
            </tbody>
          </PropertiesTable>
        )}
      </div>
    );
  }
}
