import * as React from 'react';

import styled from '../../styled-components';

import { DropdownProps } from '../../common-elements';
import { MediaTypeModel } from '../../services/models';
import { Markdown } from '../Markdown/Markdown';
import { Example } from './Example';
import { DropdownLabel, DropdownWrapper, NoSampleLabel } from './styled.elements';
import { ScopesContext } from '../ScopesDlg/ScopesContext';     //  We wanna know - are we displaying long-form URLs ??

export interface PayloadSamplesProps {
  mediaType: MediaTypeModel;
  renderDropdown: (props: DropdownProps) => JSX.Element;
}

interface MediaTypeSamplesState {
  activeIdx: number;
}

export class MediaTypeSamples extends React.Component<PayloadSamplesProps, MediaTypeSamplesState> {
  static contextType = ScopesContext;

  state = {
    activeIdx: 0,
  };
  switchMedia = ({ idx }) => {
    this.setState({
      activeIdx: idx,
    });
  };
  render() {
    const { activeIdx } = this.state;
    const examples = this.props.mediaType.examples || {};
    const mimeType = this.props.mediaType.name;

    const noSample = <NoSampleLabel>No sample</NoSampleLabel>;

    const examplesNames = Object.keys(examples);
    if (examplesNames.length === 0) {
      return noSample;
    }

    // We have OAuth scopes; and two named examples 'main' and 'altURL' --- So use the longURLs setting to pick the right example...
    if(this.context.scopes && examplesNames.length == 2 && examplesNames[0] == 'main' && examplesNames[1] == 'altURL') {
      const chosenIdx = this.context.longURLs ? 1 : 0;
      const example = examples[examplesNames[chosenIdx]];

      return (
        <SamplesWrapper>
          {example.description && <Markdown source={example.description} />}
          <Example example={example} mimeType={mimeType} />
        </SamplesWrapper>
      );      
    }

    // More than one named example ... we'll need a drop down
    if (examplesNames.length > 1) {
      const options = examplesNames.map((name, idx) => {
        return {
          value: examples[name].summary || name,
          idx,
        };
      });

      const example = examples[examplesNames[activeIdx]];
      const description = example.description;

      return (
        <SamplesWrapper>
          <DropdownWrapper>
            <DropdownLabel>Example</DropdownLabel>
            {this.props.renderDropdown({
              value: options[activeIdx].value,
              options,
              onChange: this.switchMedia,
              ariaLabel: 'Example',
            })}
          </DropdownWrapper>
          <div>
            {description && <Markdown source={description} />}
            <Example example={example} mimeType={mimeType} />
          </div>
        </SamplesWrapper>
      );
    } else {
      const example = examples[examplesNames[0]];
      return (
        <SamplesWrapper>
          {example.description && <Markdown source={example.description} />}
          <Example example={example} mimeType={mimeType} />
        </SamplesWrapper>
      );
    }
  }
}

const SamplesWrapper = styled.div`
  margin-top: 15px;
`;
