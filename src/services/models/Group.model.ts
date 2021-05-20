import { action, observable } from 'mobx';

import { OpenAPIExternalDocumentation, OpenAPITag } from '../../types';
import { safeSlugify } from '../../utils';
import { MarkdownHeading, MarkdownRenderer } from '../MarkdownRenderer';
import { ContentItemModel } from '../MenuBuilder';
import { IMenuItem, MenuItemGroupType } from '../MenuStore';

/**
 * Operations Group model ready to be used by components
 */
export class GroupModel implements IMenuItem {
  //#region IMenuItem fields
  id: string;
  absoluteIdx?: number;
  name: string;
  description?: string;
  type: MenuItemGroupType;

  items: ContentItemModel[] = [];
  parent?: GroupModel;
  externalDocs?: OpenAPIExternalDocumentation;

  @observable
  active: boolean = false;
  @observable
  expanded: boolean = false;

  depth: number;
  level: number;
  //#endregion

  // This groupModel is hidden if all its operation children are hidden
  isHidden(scopes: Map<String, boolean>, longURLs: boolean): boolean {

    // If there are no operations ... then it's pure narrative and can't be hidden
    if (!this.hasOperations()) {
      return false;
    }

    // If one of the operations is visable, we can't be hidden
    if (this.hasVisibleOperations(scopes, longURLs)) {
      return false;
    }

    // No visible operations ... Hide if we've hidden operations...
    return this.hasHiddenOperations(scopes, longURLs);
  }

  // This groupModel has operations 
  hasOperations(): boolean {

    for (let it of this.items) {
      if (it.type === 'operation' || it.hasOperations()) {
        return true;
      }
    }

    // We don't have any operations
    return false;
  }

  hasHiddenOperations(scopes: Map<String, boolean>, longURLs: boolean): boolean {

    // No scopes defined means no hidden operations...
    if (Object.keys(scopes).length == 0) {
      return false;
    }

    for (let it of this.items) {

      // This operation is hidden - we're done - we've got a hidden tag
      if (it.type === 'operation' && it.isHidden(scopes, longURLs)) {
        return true;
      }

      // Recurse for tags, groups and sections
      if (it.type !== 'operation') {

        // does that tag, group or section have hidden tags ??
        if (it.hasHiddenOperations(scopes, longURLs)) {
          return true;
        }
      }
    }

    // We don't have any hidden operations
    return false;
  }

  hasVisibleOperations(scopes: Map<String, boolean>, longURLs: boolean): boolean {

    // No scopes defined means no hidden operations...
    if (Object.keys(scopes).length == 0) {
      return true;
    }

    for (let it of this.items) {

      // This operation is visible - we're done - we've got a visible operation
      if (it.type === 'operation' && !it.isHidden(scopes, longURLs)) {
        return true;
      }

      // Recurse for tags, groups and sections
      if (it.type !== 'operation') {

        // does that tag, group or section have visible operations ??
        if (it.hasVisibleOperations(scopes, longURLs)) {
          return true;
        }
      }
    }

    // We don't have any visible operations
    return false;
  }

  constructor(
    type: MenuItemGroupType,
    tagOrGroup: OpenAPITag | MarkdownHeading,
    parent?: GroupModel,
  ) {
    // markdown headings already have ids calculated as they are needed for heading anchors
    this.id = (tagOrGroup as MarkdownHeading).id || type + '/' + safeSlugify(tagOrGroup.name);
    this.type = type;
    this.name = tagOrGroup['x-displayName'] || tagOrGroup.name;
    this.level = (tagOrGroup as MarkdownHeading).level || 1;

    // remove sections from markdown, same as in ApiInfo
    this.description = tagOrGroup.description || '';

    const items = (tagOrGroup as MarkdownHeading).items;
    if (items && items.length) {
      this.description = MarkdownRenderer.getTextBeforeHading(this.description, items[0].name);
    }

    this.parent = parent;
    this.externalDocs = (tagOrGroup as OpenAPITag).externalDocs;

    // groups are active (expanded) by default
    if (this.type === 'group') {
      this.expanded = true;
    }
  }

  @action
  activate() {
    this.active = true;
  }

  @action
  expand() {
    if (this.parent) {
      this.parent.expand();
    }
    this.expanded = true;
  }

  @action
  collapse() {
    // disallow collapsing groups
    if (this.type === 'group') {
      return;
    }
    this.expanded = false;
  }

  @action
  deactivate() {
    this.active = false;
  }
}
