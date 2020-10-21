import { observer } from 'mobx-react';
import * as React from 'react';
import { ScopesDialog, ScopeOption } from './styled.elements';
import { ScopesState } from './ScopesContext';

 
@observer
export class ScopesSelector extends React.Component<{ scopes: Map<String, boolean>, handleScopeChange: (e) => void }, ScopesState> {
    
    constructor(props) {
      super(props);
      this.handleScopeChange = this.handleScopeChange.bind(this);
    }

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

  render() {
 
    return (
        <ScopesDialog>
            <span>OAuth2 Scopes:</span>
            {this.createCheckboxes()}
        </ScopesDialog>
    );
  }
}
