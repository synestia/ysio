import { Socket } from "socket.io";
import { Document } from "./server/Document";

export const UPDATE_EMIT = "update-yjs";
export const AWARENESS_EMIT = "awareness-yjs";
export const PROXY_UPDATE_EMIT = "proxy-update-yjs";
export const SYNC_DOCUMENT = "sync-document-yjs";

/* Server side types */

export type Persistence = {
  provider: any;
  bindState: (doc: Document) => void;
  writeState: (doc: Document) => void;
};

export type next = (update: Uint8Array) => void;

export type DocumentOptions = {
  onUpdate?(
    update: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  onProxyUpdate?(
    update: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  awarenessUpdate?(
    awareness: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;  

  persistence?: Persistence;

  waitBeforeDestroy?: number;
};

export type ServerProviderOptions = {
  authenticate?(socket: Socket): boolean | Promise<boolean>;
  onConnection?(document: Document, toEmit: any): void;
};

/* Client side types */

export enum UpdateLogic {
  // Only use proxy for communication
  ONLY_PROXY = "only-proxy",
  // Only use server for communication
  ONLY_SERVER = "only-server", 
  // Use both proxy and server for communication
  FULL = "full",    
}

export type ClientProviderOptions = {
  /* Variables */
  updateLogic?: UpdateLogic;
  customNamespace?: string;
  autoConnect?: boolean;
  authentication?: {[key: string]: any};
  forceNew?: boolean;
  // On client side updates -> changes od local yDoc
  onUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;
  onProxyUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;
  onAwarenessUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;

  // On incoming updates -> changes of remote yDoc aka server
  incomingUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;
  incomingProxyUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;
  incomingAwarenessUpdate?(update: Uint8Array, next: next): Function | void | Promise<void | Function>;
  onConnectionError?(socket: Socket, error: Error): void;
}