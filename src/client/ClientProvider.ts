import { io, Manager, Socket } from "socket.io-client";
import {
  AWARENESS_EMIT,
  AwarenessUpdate,
  ClientProviderOptions,
  PROXY_UPDATE_EMIT,
  SYNC_DOCUMENT,
  UPDATE_EMIT,
  next,
} from "types";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export class ClientProvider {
  private _socket!: Socket;

  private _documentName: string;

  private _options?: ClientProviderOptions;

  private _yDoc: Y.Doc;
  private _awareness: awarenessProtocol.Awareness;

  constructor(
    url: string,
    documentName: string,
    yDoc: Y.Doc,
    options?: ClientProviderOptions
  );
  constructor(
    manager: Manager,
    documentName: string,
    yDoc: Y.Doc,
    options?: ClientProviderOptions
  );
  constructor(
    urlOrManager: string | Manager,
    documentName: string,
    yDoc: Y.Doc,
    options?: ClientProviderOptions
  ) {
    this._documentName = documentName;
    this._options = options;

    this._yDoc = yDoc;
    this._awareness = new awarenessProtocol.Awareness(this._yDoc);

    if (typeof urlOrManager === "string") {
      this.initWithUrl(urlOrManager);
    } else {
      this.initWithManager(urlOrManager);
    }

    /* Local Changes */
    this._yDoc.on("update", (update) => {
      this.onYDocUpdate(update);
      this.onProxyUpdate(update);
    });
    this._awareness.on("change", (changes: AwarenessUpdate) => {
      this.onAwarenessUpdate(changes);
    });

    /* Socket Changes */
    this._socket.on(UPDATE_EMIT, (update: Uint8Array) => {
      this.incomingUpdate(update);
    });
    this._socket.on(PROXY_UPDATE_EMIT, (update: Uint8Array) => {
      this.incomingProxyUpdate(update);
    });
    this._socket.on(AWARENESS_EMIT, (update: Uint8Array) => {
      this.incomingAwarenessUpdate(update);
    });

    this._socket.on("connect_error", (error: Error) => {
      this.onConnectionError(error);
    });

    if (!this._options?.autoConnect) {
      // Start syncing document with backend
      this.syncDocument();
    }
  }

  private initWithUrl(url: string): void {
    // Remove trailing slash
    while (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    /*
        Creates an url that includes namespace and document name
        for example: http://localhost:3000/yjs-1234
                    |         url         | ⬇ |documentName|
                                        namespace
    */
    const namespaceUrl = `${url}/${this._options?.customNamespace ?? "yjs-"}${
      this._documentName
    }`;

    this._socket = io(namespaceUrl, {
      forceNew: this._options?.forceNew ?? false,
      autoConnect: this._options?.autoConnect ?? true,
      auth: this._options?.authentication,
    });
  }

  private initWithManager(manager: Manager): void {
    const namespace = `/${this._options?.customNamespace ?? "yjs-"}${
      this._documentName
    }`;
    this._socket = manager.socket(namespace);
  }

  public get yDoc(): Y.Doc {
    return this._yDoc;
  }

  public get socket(): Socket {
    return this._socket;
  }

  public syncDocument(): void {
    this._socket.emit(SYNC_DOCUMENT);
  }

  /* On Y.Doc Changes */
  private onYDocUpdate(update: Uint8Array): void {
    if (this._options?.updateLogic === "only-proxy") {
      return;
    }

    const next: next = (update: Uint8Array) => {
      this._socket.emit(UPDATE_EMIT, update);
    };

    if (this._options?.onUpdate !== undefined) {
      const result = this._options.onUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  private onProxyUpdate(update: Uint8Array): void {
    if (this._options?.updateLogic === "only-server") {
      return;
    }

    const next: next = (update: Uint8Array) => {
      this._socket.emit(PROXY_UPDATE_EMIT, update);
    };

    if (this._options?.onProxyUpdate !== undefined) {
      const result = this._options.onProxyUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  private onAwarenessUpdate(changes: AwarenessUpdate): void {
    const changedClients = changes.added
      .concat(changes.updated)
      .concat(changes.removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(
      this._awareness,
      changedClients
    );

    const next: next = (update: Uint8Array) => {
      this._socket.emit(AWARENESS_EMIT, update);
    };

    if (this._options?.onAwarenessUpdate !== undefined) {
      const result = this._options.onAwarenessUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  /* On Socket Changes */
  private incomingUpdate(update: Uint8Array): void {
    if (this._options?.updateLogic === "only-proxy") {
      return;
    }

    const next: next = (update: Uint8Array) => {
      this._yDoc.transact(() => {
        Y.applyUpdate(this._yDoc, update);
      });
    };

    if (this._options?.incomingUpdate !== undefined) {
      const result = this._options.incomingUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  private incomingProxyUpdate(update: Uint8Array): void {
    if (this._options?.updateLogic === "only-server") {
      return;
    }

    const next: next = (update: Uint8Array) => {
      this._yDoc.transact(() => {
        Y.applyUpdate(this._yDoc, update);
      });
    };

    if (this._options?.incomingProxyUpdate !== undefined) {
      const result = this._options.incomingProxyUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  private incomingAwarenessUpdate(update: Uint8Array): void {
    const next: next = (update: Uint8Array) => {
      awarenessProtocol.applyAwarenessUpdate(
        this._awareness,
        update,
        this._socket
      );
    };

    if (this._options?.incomingAwarenessUpdate !== undefined) {
      const result = this._options.incomingAwarenessUpdate(update, next);

      if (result instanceof Promise) {
        result.then((fn) => fn && fn());
      } else {
        result && result();
      }
    } else {
      next(update);
    }
  }

  private onConnectionError(error: Error): void {
    if (this._options?.onConnectionError !== undefined) {
      this._options.onConnectionError(error);
    } else {
      console.error(error);
    }
  }
}
