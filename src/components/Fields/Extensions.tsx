import * as React from 'react';

import * as prettyCompactJSON from 'json-stringify-pretty-compact';

import { ExtensionValue, FieldLabel } from '../../common-elements/fields';

import { ShelfIcon } from '../../common-elements/shelfs';

import styled from '../../styled-components';

import { OptionsContext } from '../OptionsProvider';

import { StyledMarkdownBlock } from '../Markdown/styled.elements';

import { Markdown } from '../Markdown/Markdown';

const Extension = styled(StyledMarkdownBlock)`
  margin: 2px 0;
`;

const Label = styled(FieldLabel)`
  font-weight: bold;
  cursor: pointer;
  color: ${ props => props.theme.typography.code.color};
`;

export interface ExtensionsProps {
  extensions: {
    [k: string]: any;
  };
}

export interface ExtnProps {
  label: string;
  extension: any;
}

export class Extn extends React.PureComponent<ExtnProps> {
  state = { expanded: false };
  toggle = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render = () => {
    const label = this.props.label;
    const extn = this.props.extension;

    return (
      <>
        <Label onClick={this.toggle}> {label.substring(2)}  <ShelfIcon direction={this.state.expanded ? 'down' : 'right'} /> </Label>
        {this.state.expanded &&
          (typeof extn === 'string' ? (<Markdown source={extn} />) : (<ExtensionValue>{prettyCompactJSON(extn)}</ExtensionValue>))
        }
      </>
    )
  }
}

export class Extensions extends React.PureComponent<ExtensionsProps> {
  render() {
    const exts = this.props.extensions;

    return (
      <OptionsContext.Consumer>
        {options => (
          <>
            {options.showExtensions &&
              Object.keys(exts).map(key => (
                <Extension key={key}>
                  <Extn label={key} extension={exts[key]} />
                </Extension>
              ))}
          </>
        )}
      </OptionsContext.Consumer>
    );
  }
}
