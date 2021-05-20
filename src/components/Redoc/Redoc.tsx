import * as PropTypes from 'prop-types';
import * as React from 'react';

import { ThemeProvider } from '../../styled-components';
import { OptionsProvider } from '../OptionsProvider';
import { ScopesProvider } from '../ScopesDlg/ScopesContext';

import { AppStore } from '../../services';
import { ApiInfo } from '../ApiInfo/';
import { ApiLogo } from '../ApiLogo/ApiLogo';
import { ContentItems } from '../ContentItems/ContentItems';
import { SideMenu } from '../SideMenu/SideMenu';
import { StickyResponsiveSidebar } from '../StickySidebar/StickyResponsiveSidebar';
import { ApiContentWrap, BackgroundStub, RedocWrap } from './styled.elements';

import { SearchBox } from '../SearchBox/SearchBox';
import { ScopesSelector } from '../ScopesDlg/ScopesSelector';
import { StoreProvider } from '../StoreBuilder';

export interface RedocProps {
  store: AppStore;
}
export interface ScopesState {
  scopes: Map<String, boolean>,
  longURLs: boolean
}

export class Redoc extends React.Component<RedocProps, ScopesState> {
  static propTypes = {
    store: PropTypes.instanceOf(AppStore).isRequired,
  };

  componentDidMount() {
    this.props.store.onDidMount();
  }

  componentWillUnmount() {
    this.props.store.dispose();
  }

  constructor(props) {
    super(props);

    // initialise state from scopes that're defined in the original OpenAPI spec
    this.state = { scopes: props.store.scopes, longURLs: false };
    this.handleScopeChange = this.handleScopeChange.bind(this);
  }

  handleScopeChange = changeEvent => {
    const { name, id } = changeEvent.target;
    if(name) {
      this.setState(prevState => ({
        scopes: {
          ...prevState.scopes,              // use all the scope settings from the previous state
          [name]: !prevState.scopes[name],  // turn the one that's changed around
        },
        longURLs: prevState.longURLs      // ... and the longURL setting from the previous state
      }));
      return;
    }

    // Could be an unnamed item  ... check via item Id
    if(id && id == 'url') {
      this.setState(prevState => ({
        scopes: {
          ...prevState.scopes,               // use all the scope settings from the previous state
        },
        longURLs: !prevState.longURLs        // ... and switch longURL setting from the previous state
      }));
    }
  };

  render() {
    const {
      store: { spec, menu, options, search, marker },
    } = this.props;
    const store = this.props.store;
   
    return (
      <ThemeProvider theme={options.theme}>
        <StoreProvider value={this.props.store}>
          <OptionsProvider value={options}>
            <ScopesProvider value={this.state}>
              <RedocWrap className="redoc-wrap">
                <StickyResponsiveSidebar menu={menu} className="menu-content">
                  <ApiLogo info={spec.info} />
                  {(!options.disableSearch && (
                    <SearchBox
                      search={search!}
                      marker={marker}
                      getItemById={menu.getItemById}
                      onActivate={menu.activateAndScroll}
                    />
                  )) ||
                    null}
                  <ScopesSelector
                    scopes={ this.state.scopes }
                    longURLs={ this.state.longURLs }
                    handleScopeChange={ this.handleScopeChange }
                  />
                  <SideMenu menu={menu} />
                </StickyResponsiveSidebar>
                <ApiContentWrap className="api-content">
                  <ApiInfo store={store} />
                  <ContentItems items={menu.items as any} />
                </ApiContentWrap>
                <BackgroundStub />
              </RedocWrap>
            </ScopesProvider>
          </OptionsProvider>
        </StoreProvider>
      </ThemeProvider>
    );
  }
}
