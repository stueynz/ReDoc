// import { observe } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { ScopesContext } from '../ScopesDlg/ScopesContext';

import { ShelfIcon } from '../../common-elements/shelfs';
import { IMenuItem, OperationModel } from '../../services';
import { shortenHTTPVerb } from '../../utils/openapi';
import { MenuItems } from './MenuItems';
import { MenuItemLabel, MenuItemLi, MenuItemTitle, OperationBadge } from './styled.elements';
import { l } from '../../services/Labels';

export interface MenuItemProps {
  item: IMenuItem;
  onActivate?: (item: IMenuItem) => void;
  withoutChildren?: boolean;
}

@observer
export class MenuItem extends React.Component<MenuItemProps> {
  ref = React.createRef<HTMLLabelElement>();
  static contextType = ScopesContext;

  activate = (evt: React.MouseEvent<HTMLElement>) => {
    this.props.onActivate!(this.props.item);
    evt.stopPropagation();
  };

  componentDidMount() {
    this.scrollIntoViewIfActive();
  }

  componentDidUpdate() {
    this.scrollIntoViewIfActive();
  }

  scrollIntoViewIfActive() {
    if (this.props.item.active && this.ref.current) {
      this.ref.current.scrollIntoViewIfNeeded();
    }
  }

  render() {
    const { item, withoutChildren } = this.props;

    if (item.type === 'operation') {     
      //  We might be hiding operations based upon OAuth Scope settings...
      if(item.isHidden(this.context.scopes, this.context.longURLs)) {
        return null;
      }
    }
    else if(item.type == 'tag') {
      // If all the operationChildren are hidden, then hide the Tag item as well...
      var hiddenChildren=0;
      for(let it of item.items) {
        if(it.type === 'operation' && it.isHidden(this.context.scopes, this.context.longURLs)) {
          hiddenChildren++;
        }
      }
      // if all the children operations are hidden, then this 'tag' is hidden
      if(hiddenChildren === item.items.length) {
        return null;
      }
    }
    else if(item.type == 'group') {
      // If all the operation children are hidden, then hide the Group item as well...
      // Not all children are operations...
      var hiddenOperations=0, operations=0;
      for(let it of item.items) {
        if(it.type === 'operation') {
          operations++;
          if(it.isHidden(this.context.scopes, this.context.longURLs)) {
            hiddenOperations++;
          }
        }
        else if(it.type === 'tag') {
          for(let op of it.items) {
            if (op.type === 'operation') {
              operations++;
              if(op.isHidden(this.context.scopes, this.context.longURLs)) {
                hiddenOperations++;
             }
            }
          }
        }
      }
      
      // all the operations are hidden so hide the group
      if(operations == hiddenOperations) {
        return null;
      }
    }
    else if(item.type != 'section') {
      console.log('menuItem:' + item.id + ' type:' + item.type + ' something to hide?');
    }

    // Ok we're not hiding anything... let's do it...
    return (
      <MenuItemLi onClick={this.activate} depth={item.depth} data-item-id={item.id}>
        {item.type === 'operation' ? (
          <OperationMenuItemContent {...this.props} item={item as OperationModel} />
        ) : (
          <MenuItemLabel depth={item.depth} active={item.active} type={item.type} ref={this.ref}>
            <MenuItemTitle title={item.name}>
              {item.name}
              {this.props.children}
            </MenuItemTitle>
            {(item.depth > 0 && item.items.length > 0 && (
              <ShelfIcon float={'right'} direction={item.expanded ? 'down' : 'right'} />
            )) ||
              null}
          </MenuItemLabel>
        )}
        {!withoutChildren && item.items && item.items.length > 0 && (
          <MenuItems
            expanded={item.expanded}
            items={item.items}
            onActivate={this.props.onActivate}
          />
        )}
      </MenuItemLi>
    );
  }
}

export interface OperationMenuItemContentProps {
  item: OperationModel;
}

@observer
export class OperationMenuItemContent extends React.Component<OperationMenuItemContentProps> {
  ref = React.createRef<HTMLLabelElement>();

  componentDidUpdate() {
    if (this.props.item.active && this.ref.current) {
      this.ref.current.scrollIntoViewIfNeeded();
    }
  }

  render() {
    const { item } = this.props;
    return (
      <MenuItemLabel
        depth={item.depth}
        active={item.active}
        deprecated={item.deprecated}
        ref={this.ref}
      >
        {item.isWebhook ? (
          <OperationBadge type="hook">{l('webhook')}</OperationBadge>
        ) : (
          <OperationBadge type={item.httpVerb}>{shortenHTTPVerb(item.httpVerb)}</OperationBadge>
        )}
        <MenuItemTitle width="calc(100% - 38px)">
          {item.name}
          {this.props.children}
        </MenuItemTitle>
      </MenuItemLabel>
    );
  }
}
