  import * as React from 'react';

  export interface ScopesContext {
    scopes: Map<String,boolean>;
    longURLs: boolean; 
  }
  
  export const ScopesContext = React.createContext( {scopes: new Map<String, boolean>(),  longURLs: true});
  export const ScopesProvider = ScopesContext.Provider;
  export const ScopesConsumer = ScopesContext.Consumer;
  