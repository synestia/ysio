import * as Y from "yjs";
import { Socket } from "socket.io";
import { Document } from "./server/Document";

/*
  Constant values used in emits
*/
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
/**
 * Persistence options
 * @property {any} provider - Provider for persistence
 * @property {function} bindState - Bind state to provider
 * @property {function} writeState - Write state to provider
 */
type PersistenceOptions = {
  provider: any;
  bindState: (doc: Document) => void;
  writeState: (doc: Document) => void;
};

/**
 * Persistence class
 * @class Persistence
 * @param {any} provider - Provider for persistence
 * @param {function} bindState - Bind state to provider
 * @param {function} writeState - Write state to provider
 */
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

/**
 * Defines a persistence mechanism using the provided options.
 *
 * @param options - The persistence options.
 * @param options.provider - The provider to be used for persistence.
 * @param options.bindState - The function to bind the state.
 * @param options.writeState - The function to write the state.
 * @returns A new instance of the Persistence class configured with the provided options.
 */
export function definePersistence(options: PersistenceOptions): Persistence {
  const { provider, bindState, writeState } = options;

  const boundBindState = bindState.bind({ provider });
  const boundWriteState = writeState.bind({ provider });

  return new Persistence(provider, boundBindState, boundWriteState);
}

/**
 * Next function
 * @param update - Update data
 * @returns void
 */
export type next = (update: Uint8Array) => void;

/**
 * Document options
 *
 * @param onUpdate - Callback function triggered on document update.
 * @param onProxyUpdate - Callback function triggered on proxy update.
 * @param awarenessUpdate - Callback function triggered on awareness update.
 * @param persistence - Persistence options for the document.
 * @param waitBeforeDestroy - How long should provider wait before destroying the document after last client disconnected.
 */
export type DocumentOptions = {
  /**
   * Callback function triggered on document update.
   *
   * This function is called whenever a document update occurs. It can be used
   * to handle the update, perform additional processing.
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - The update data as a Uint8Array.
   * @param next - The next middleware function in the stack.
   * @param socket - The socket instance associated with the update.
   * @returns A function, void, or a Promise resolving to void or a function.
   */
  onUpdate?(
    update: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  /**
   * Callback function triggered on document update.
   *
   * This function is called whenever a document update occurs. It can be used
   * to handle the update, perform additional processing.
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - The update data as a Uint8Array.
   * @param next - The next middleware function in the stack.
   * @param socket - The socket instance associated with the update.
   * @returns A function, void, or a Promise resolving to void or a function.
   */
  onUpdate?(
    update: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  /**
   * Callback function triggered on proxy update.
   *
   * This function is called whenever a proxy update occurs. It can be used
   * to handle the update, perform additional processing.
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - The update data as a Uint8Array.
   * @param next - The next middleware function in the stack.
   * @param socket - The socket instance associated with the update.
   * @returns A function, void, or a Promise resolving to void or a function.
   */
  onProxyUpdate?(
    update: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  /**
   * Callback function triggered on awareness update.
   *
   * This function is called whenever an awareness update occurs. It can be used
   * to handle the update, perform additional processing, or pass the update
   * to the next function to confirm the update.
   *
   * @param awareness - The awareness data as a Uint8Array.
   * @param next - The next middleware function in the stack.
   * @param socket - The socket instance associated with the update.
   * @returns A function, void, or a Promise resolving to void or a function.
   */
  awarenessUpdate?(
    awareness: Uint8Array,
    next: next,
    socket: Socket
  ): Function | void | Promise<void | Function>;

  /**
   * Persistence options for the document.
   */
  persistence?: Persistence;

  /**
   * How long should provider wait before destroying the document after last client disconnected.
   */
  waitBeforeDestroy?: number;
};

/**
 * Server provider options
 *
 * @param authenticate - A function that authenticates the connection.
 * @param onConnection - A function that is called when a connection is established.
 */
export type ServerProviderOptions = {
  /**
   *
   * @param socket - The socket instance associated with the update.
   * @returns A boolean or a Promise resolving to a boolean. If the result isn't true, the connection will be rejected.
   */
  authenticate?(socket: Socket): boolean | Promise<boolean>;
  /**
   *
   * @param document - The document instance associated with the update.
   * @param content - The content of the connection message. It can be any object that comes from the client provider.
   * @returns Any object that will be sent back to the client provider in callback.
   */
  onConnection?(document: Document, content: any): any;
};

/* Client side types */

/**
 * Update logic
 *
 * Indicates how the client should send updates.
 * Server means that update will be saved on server (if persistence is enabled).
 * Proxy means that update could be processed (for example checked if the user has permissions to do that) and then sent to other clients.
 *
 * @param ONLY_PROXY - Only use proxy for communication
 * @param ONLY_SERVER - Only use server for communication
 * @param FULL - Use both proxy and server for communication
 */
export enum UpdateLogic {
  // Only use proxy for communication
  ONLY_PROXY = "only-proxy",
  // Only use server for communication
  ONLY_SERVER = "only-server",
  // Use both proxy and server for communication
  FULL = "full",
}

/**
 * Client provider options
 *
 * @param {UpdateLogic} updateLogic - Update logic
 * @param customNamespace - Custom namespace
 * @param autoConnect - Automatically connect to the server
 * @param authentication - Authentication data
 * @param forceNew - Force new connection
 * @param onUpdate - Callback function triggered on yDoc update for server updating
 * @param onProxyUpdate - Callback function triggered on yDoc update for proxy updating
 * @param onAwarenessUpdate - Callback function triggered on awareness update on client side
 *
 * @param incomingUpdate - Callback function triggered on incoming update from server
 * @param incomingProxyUpdate - Callback function triggered on incoming proxy update
 * @param incomingAwarenessUpdate - Callback function triggered on incoming awareness update
 * @param onConnectionError - Callback function triggered on connection error
 *
 * @param ConnectionMessageOptions - Connection message options
 */
export type ClientProviderOptions = {
  /* Variables */
  updateLogic?: UpdateLogic;
  customNamespace?: string;
  autoConnect?: boolean;
  authentication?: { [key: string]: any };
  forceNew?: boolean;

  // On client side updates -> changes od local yDoc

  /**
   * Function triggered on yDoc update for server updating
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  onUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  /**
   * Function triggered on yDoc update for proxy updating
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  onProxyUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  /**
   * Function triggered on awareness update on client side
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  onAwarenessUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  // On incoming updates -> changes of remote yDoc aka server

  /**
   * Function triggered on incoming update from server
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  incomingUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  /**
   * Function triggered on incoming proxy update
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  incomingProxyUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  /**
   * Function triggered on incoming awareness update
   *
   * To confirm the update, call or return the next function while giving it the update.
   *
   * @param update - Update data
   * @param next - Function used to confirm the update
   */
  incomingAwarenessUpdate?(
    update: Uint8Array,
    next: next
  ): Function | void | Promise<void | Function>;

  /**
   * Function triggered on connection error
   *
   * @param error - Error object
   */
  onConnectionError?(error: Error): void;

  /**
   * Connection message options
   *
   * @param sendMessage - Function used to send message
   * @param onCallback - Function used to handle callback
   */
  ConnectionMessageOptions?: {
    /**
     *
     * @param yDoc - Y.Doc instance to send
     * @returns Any object that will be sent to the server provider as message content.
     */
    sendMessage(yDoc?: Y.Doc): any;

    /**
     *
     * @param callback - Any object that comes from the server provider as callback
     * @param yDoc - Y.Doc instance to use
     */
    onCallback(callback: any, yDoc?: Y.Doc): void;
  };
};
