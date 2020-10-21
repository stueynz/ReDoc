  import * as React from 'react';

  export interface ScopesState {
      scopes: Map<String,boolean>;
      expanded: boolean;
  }
  
  export const ScopesContext = React.createContext(new Map<String, boolean>());
  export const ScopesProvider = ScopesContext.Provider;
  export const ScopesConsumer = ScopesContext.Consumer;
  