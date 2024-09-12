import { Socket } from "socket.io";
import { Document } from "./Document";

export const UPDATE_EMIT = "update-yjs";
export const AWARENESS_EMIT = "awareness-yjs";
export const PROXY_UPDATE_EMIT = "proxy-update-yjs";
export const SYNC_DOCUMENT = "sync-document-yjs";

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
  onDisconnect?(socket: Socket): void | Promise<void>;
  persistence?: Persistence;
};

export type ServerProviderOptions = {
  authenticate?(socket: Socket): boolean | Promise<boolean>;
};
