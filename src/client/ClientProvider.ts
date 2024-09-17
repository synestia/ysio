import { io, Manager, Socket } from "socket.io-client";
import {
  AWARENESS_EMIT,
  AwarenessUpdate,
  ClientProviderOptions,
  PROXY_UPDATE_EMIT,
  SYNC_DOCUMENT,
  UPDATE_EMIT,
} from "types";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export class ClientProvider {
  private readonly url?: string;
  private socket!: Socket;

  private documentName: string;

  private options?: ClientProviderOptions;

  private yDoc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;

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
    this.documentName = documentName;
    this.options = options;

    this.yDoc = yDoc;
    this.awareness = new awarenessProtocol.Awareness(this.yDoc);

    if (typeof urlOrManager === "string") {
      this.initWithUrl(urlOrManager);
    } else {
      this.initWithManager(urlOrManager);
    }

    /* Local Changes */
    this.yDoc.on("update", (update) => {
      this.onYDocUpdate(update);
      this.onProxyUpdate(update);
    });
    this.awareness.on("change", (changes: AwarenessUpdate) => {
      this.onAwarenessUpdate(changes);
    });

    /* Socket Changes */
    this.socket.on(UPDATE_EMIT, (update: Uint8Array) => {
      this.incomingUpdate(update);
    });
    this.socket.on(PROXY_UPDATE_EMIT, (update: Uint8Array) => {
      this.incomingProxyUpdate(update);
    });
    this.socket.on(AWARENESS_EMIT, (update: Uint8Array) => {
      this.incomingAwarenessUpdate(update);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.onConnectionError(error);
    });

    // Start syncing document with backend
    this.syncDocument();
  }

  private initWithUrl(url: string): void {
    // Remove trailing slash
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    /*
        Creates an url that includes namespace and document name
        for example: http://localhost:3000/yjs-1234
                    |         url         | ⬇ |documentName|
                                        namespace
    */
    const namespaceUrl = `${url}/${this.options?.customNamespace ?? "yjs-"}${
      this.documentName
    }`;

    this.socket = io(namespaceUrl, {
      forceNew: this.options?.forceNew ?? false,
      autoConnect: this.options?.autoConnect ?? true,
      auth: this.options?.authentication,
    });
  }

  private initWithManager(manager: Manager): void {
    const namespace = `/${this.options?.customNamespace ?? "yjs-"}${
      this.documentName
    }`;
    this.socket = manager.socket(namespace);
  }

  public getYDoc(): Y.Doc {
    return this.yDoc;
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public syncDocument(): void {
    this.socket.emit(SYNC_DOCUMENT);
  }

  /* On Y.Doc Changes */
  private onYDocUpdate(update: Uint8Array): void {}

  private onProxyUpdate(update: Uint8Array): void {}

  private onAwarenessUpdate(changes: AwarenessUpdate): void {}

  /* On Socket Changes */
  private incomingUpdate(update: Uint8Array): void {}

  private incomingProxyUpdate(update: Uint8Array): void {}

  private incomingAwarenessUpdate(update: Uint8Array): void {}

  private onConnectionError(error: Error): void {}
}
