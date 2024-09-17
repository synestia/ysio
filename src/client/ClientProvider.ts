import { io, Manager, Socket } from "socket.io-client";
import { ClientProviderOptions } from "types";
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
}
