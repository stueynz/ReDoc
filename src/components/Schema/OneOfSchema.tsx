import { observer } from 'mobx-react';
import * as React from 'react';

import {
  OneOfButton as StyledOneOfButton,
  OneOfButtonTruncated,
  OneOfLabel,
  OneOfList,
} from '../../common-elements/schema';
import { SchemaModel } from '../../services/models';
import { Schema, SchemaProps } from './Schema';
import { RedocNormalizedOptions } from '../../services';
import { OptionsContext } from '../OptionsProvider';

export interface OneOfButtonProps {
  subSchema: SchemaModel;
  idx: number;
  schema: SchemaModel;
}

@observer
export class OneOfButton extends React.Component<OneOfButtonProps> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;

  render() {
    const { idx, schema, subSchema } = this.props;

    if (this.props.schema.oneOfTruncated && idx > this.context.oneOfSuppressionThreshold)
      return null;

    // We're truncating the list .... to make things more compact
    if (this.props.schema.oneOfTruncated && idx === this.context.oneOfSuppressionThreshold)
      return <OneOfButtonTruncated onClick={this.undoTruncate}> more... </OneOfButtonTruncated>;

    return (
      <StyledOneOfButton active={idx === schema.activeOneOf} onClick={this.activateOneOf}>
        {subSchema.title || subSchema.typePrefix + subSchema.displayType}
      </StyledOneOfButton>
    );
  }

  activateOneOf = () => {
    this.props.schema.activateOneOf(this.props.idx);
  };

  undoTruncate = () => {
    this.props.schema.truncateOneOf(false);
  };
}

@observer
export class OneOfSchema extends React.Component<SchemaProps> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;

  render() {
    const {
      schema: { oneOf },
      schema,
    } = this.props;

    if (oneOf === undefined) {
      return null;
    }

    return (
      <div>
        <OneOfLabel> {schema.oneOfType} </OneOfLabel>
        <OneOfList>
          {oneOf.map((subSchema, idx) => (
            <OneOfButton key={subSchema.pointer} schema={schema} subSchema={subSchema} idx={idx} />
          ))}
        </OneOfList>
        <Schema {...this.props} schema={oneOf[schema.activeOneOf]} />
      </div>
    );
  }
}
