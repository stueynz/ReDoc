import { observer } from 'mobx-react';
import * as React from 'react';

import { ShelfIcon } from '../../common-elements/shelfs';

import { ScopesDialog, ScopeOption, ScopeLabel } from './styled.elements';

interface ScopesState {
  expanded: boolean;
}

@observer
export class ScopesSelector extends React.Component<{ scopes: Map<String, boolean>, longURLs:boolean, handleScopeChange: (e) => void }, ScopesState> {

  constructor(props) {
    super(props);
    this.handleScopeChange = this.handleScopeChange.bind(this);
  }

  state = { expanded: false };
  toggleScopes = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  handleScopeChange = changeEvent => {
    this.props.handleScopeChange(changeEvent);
  };

  createCheckbox = option => (
    <ScopeOption
      label={option}
      isSelected={this.props.scopes[option]}
      onCheckboxChange={this.handleScopeChange}
      key={option}
    />
  );

  createCheckboxes = () => Object.keys(this.props.scopes).map(this.createCheckbox);
  selectedScopes = () => {
    return <span>{Object.keys(this.props.scopes).map(key => this.props.scopes[key] === true ? key : null).filter(Boolean).join(',')}</span>;
  }
  selectedURLs = () => {
    return this.props.longURLs ? "Long-Form" : "Short-Form";
  }

  render() {

    // No scopes ... means no dialog
    if (Object.keys(this.props.scopes).length == 0) {
      return null;
    }

    return (
      <ScopesDialog>
        <ScopeLabel onClick={this.toggleScopes}>
          <span>OAuth2 Scopes:</span>
          {!this.state.expanded && this.selectedScopes()}
          <ShelfIcon color="primary" direction={this.state.expanded ? 'down' : 'right'} />
        </ScopeLabel><br/>
        {this.state.expanded && this.createCheckboxes()}
        <ScopeLabel  id="url" onClick={this.handleScopeChange}>
          <span>URLs:</span>{ this.selectedURLs() }
        </ScopeLabel>
      </ScopesDialog>
    );
  }
}
