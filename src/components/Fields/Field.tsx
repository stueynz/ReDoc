import { observer } from 'mobx-react';
import * as React from 'react';

import { ClickablePropertyNameCell, RequiredLabel } from '../../common-elements/fields';
import { FieldDetails } from './FieldDetails';

import { ScopesContext } from '../ScopesDlg/ScopesContext';

import {
  InnerPropertiesWrap,
  PropertyBullet,
  PropertyCellWithInner,
  PropertyDetailsCell,
  PropertyNameCell,
} from '../../common-elements/fields-layout';

import { ShelfIcon } from '../../common-elements/';

import { FieldModel } from '../../services/models';
import { Schema, SchemaOptions } from '../Schema/Schema';

export interface FieldProps extends SchemaOptions {
  className?: string;
  isLast?: boolean;
  showExamples?: boolean;

  field: FieldModel;
  expandByDefault?: boolean;

  renderDiscriminatorSwitch?: (opts: FieldProps) => JSX.Element;
}

@observer
export class Field extends React.Component<FieldProps> {

  static contextType = ScopesContext;

  // Is this Operation hidden, because of the current OAuth scopes??
  isHidden(): boolean {
    const { scopes } = this.context;  // which OAuth scopes are we displaying ??

    // No scopes defined means no hidden operations...
    if (Object.keys(scopes).length == 0) {
      return false;
    }

    // If the field is marked with x-deferred... then use the DEFERRED scope to decide
    if(this.props.field.schema.deferred) {
      return  ! scopes.DEFERRED;
    }

    // Are we doing long-form URLs ??
    if(this.context.longURLs) {
      return this.props.field.longFormURL !== undefined && ! this.props.field.longFormURL;
    }

    // We're doing short-form URLs
    return this.props.field.longFormURL !== undefined && this.props.field.longFormURL;
  }


  toggle = () => {
    if (this.props.field.expanded === undefined && this.props.expandByDefault) {
      this.props.field.expanded = false;
    } else {
      this.props.field.toggle();
    }
  };

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  };

  render() {
    const { className, field, isLast, expandByDefault } = this.props;
    const { name, deferred, deprecated, required, kind, readOnly, schema } = field;
    const { altURLReference } = schema;

    const withSubSchema = !field.schema.isPrimitive && !field.schema.isCircular;

    const expanded = field.expanded === undefined ? expandByDefault : field.expanded;

    const paramName = withSubSchema ? (
      <ClickablePropertyNameCell
        className={deprecated ? 'deprecated' : ''}
        kind={kind}
        title={name}
      >
        <PropertyBullet />
        <button
          onClick={this.toggle}
          onKeyPress={this.handleKeyPress}
          aria-label="expand properties"
        >
          {name}
          <ShelfIcon direction={expanded ? 'down' : 'right'} />
        </button>
        {required && !deferred && <RequiredLabel> required </RequiredLabel>}
        {deferred && <RequiredLabel> deferred </RequiredLabel>}
        {readOnly && <RequiredLabel> read-only </RequiredLabel>}
        {altURLReference && <RequiredLabel>short-form URL Only</RequiredLabel>}
      </ClickablePropertyNameCell>
    ) : (
      <PropertyNameCell className={deprecated ? 'deprecated' : undefined} kind={kind} title={name}>
        <PropertyBullet />
        {name}
        {required && !deferred && <RequiredLabel> required </RequiredLabel>}
        {deferred && <RequiredLabel> deferred </RequiredLabel>}
        {readOnly && <RequiredLabel> read-only </RequiredLabel>}
      </PropertyNameCell>
    );

    if (this.isHidden()) {
      return null;
    }

    return (
      <>
        <tr className={isLast ? 'last ' + className : className}>
          {paramName}
          <PropertyDetailsCell>
            <FieldDetails {...this.props} />
          </PropertyDetailsCell>
        </tr>
        {expanded && withSubSchema && (
          <tr key={field.name + 'inner'}>
            <PropertyCellWithInner colSpan={2}>
              <InnerPropertiesWrap>
                <Schema
                  schema={field.schema}
                  skipReadOnly={this.props.skipReadOnly}
                  skipWriteOnly={this.props.skipWriteOnly}
                  showTitle={this.props.showTitle}
                />
              </InnerPropertiesWrap>
            </PropertyCellWithInner>
          </tr>
        )}
      </>
    );
  }
}
