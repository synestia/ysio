import * as Y from "yjs";
import { Socket } from "socket.io";
import { Document } from "./server/Document";

export const UPDATE_EMIT = "update-yjs";
export const AWARENESS_EMIT = "awareness-yjs";
export const PROXY_UPDATE_EMIT = "proxy-update-yjs";
export const SYNC_DOCUMENT = "sync-document-yjs";
export const CONNECT_MESSAGE = "connection-message-yjs";

export type AwarenessUpdate = {
  added: number[];
  updated: number[];
  removed: number[];
};

/* Server side types */

type PersistenceOptions = {
  provider: any;
  bindState: (doc: Document) => void;
  writeState: (doc: Document) => void;
};

export class Persistence {
  provider: any;
  bindState: (doc: Document) => void;
  writeState: (doc: Document) => void;

  constructor(
    provider: any,
    bindState: (doc: Document) => void,
    writeState: (doc: Document) => void
  ) {
    this.provider = provider;
    this.bindState = bindState;
    this.writeState = writeState;
  }
}

export function definePersistence(options: PersistenceOptions) {
  const { provider, bindState, writeState } = options;

  const boundBindState = bindState.bind({ provider });
  const boundWriteState = writeState.bind({ provider });

  return new Persistence(provider, boundBindState, boundWriteState);
}

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
  onConnection?(document: Document, content: any): any;
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
  authentication?: { [key: string]: any };
  forceNew?: boolean;
  // On client side updates -> changes od local yDoc
  onUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;
  onProxyUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;
  onAwarenessUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  // On incoming updates -> changes of remote yDoc aka server
  incomingUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;
  incomingProxyUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;
  incomingAwarenessUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;
  onConnectionError?(error: Error): void;

  ConnectionMessageOptions?: {
    sendMessage(yDoc?: Y.Doc): any;
    onCallback(callback: any, yDoc?: Y.Doc): void;
  };
};
