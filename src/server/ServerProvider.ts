import { Namespace, Server, Socket } from "socket.io";
import {
  DocumentOptions,
  ServerProviderOptions,
  UPDATE_EMIT,
  PROXY_UPDATE_EMIT,
  AWARENESS_EMIT,
  CONNECT_MESSAGE,
} from "types";
import { Document } from "./Document";

export class ServerProvider {
  private io: Server;

  private documentOptions?: DocumentOptions;
  private serverProviderOptions?: ServerProviderOptions;

  private documents = new Map<string, Document>();

  constructor(
    io: Server,
    serverProviderOptions?: ServerProviderOptions,
    documentOptions?: DocumentOptions
  ) {
    this.io = io;
    this.documentOptions = documentOptions;
    this.serverProviderOptions = serverProviderOptions;
  }

  public init(name: string = "yjs-", documentOptions?: DocumentOptions): void {
    const namespace = new RegExp(`^\\/${name}\\d+$`);
    const replaceRegExp = new RegExp(`^\\/${name}`);

    const dynamicNamespace = this.io.of(namespace);

    // Middleware for authentication
    dynamicNamespace.use(async (socket, next) => {
      if (!this.serverProviderOptions?.authenticate) return next();
      if (await this.serverProviderOptions.authenticate(socket)) return next();
      else return next(new Error("Unauthorized"));
    });

    dynamicNamespace.on("connection", (socket) => {
      // cut everything to yjs-
      const name: string = socket.nsp.name.replace(replaceRegExp, "");

      const document = this.initDocument(name, socket.nsp, documentOptions);

      this.initSync(document, socket);
      this.initProxy(document, socket);
      this.syncDocument(document, socket);
      this.onDisconnect(document, socket);

      if (this.serverProviderOptions?.onConnection) {
        socket.on(CONNECT_MESSAGE, (content, callback) =>
          callback(this.serverProviderOptions!.onConnection!(document, content))
        );
      }
    });
  }

  private initDocument(
    name: string,
    namespace: Namespace,
    documentOptions?: DocumentOptions
  ): Document {
    if (this.documents.has(name)) return this.documents.get(name) as Document;

    const document = new Document(
      name,
      namespace,
      documentOptions || this.documentOptions
    );

    this.documents.set(name, document);
    return document;
  }

  private syncDocument(document: Document, socket: Socket): void {
    socket.on("sync-document-yjs", () => document.syncDocument(socket));
  }

  private initSync(document: Document, socket: Socket): void {
    socket.on(UPDATE_EMIT, (update: Uint8Array) => {
      document.onUpdate(update, socket);
    });

    socket.on(AWARENESS_EMIT, (update: Uint8Array) => {
      document.awarenessUpdate(update, socket);
    });
  }

  private initProxy(doc: Document, socket: Socket) {
    socket.on(PROXY_UPDATE_EMIT, (update: Uint8Array) => {
      doc.onProxyUpdate(update, socket);
    });
  }

  private onDisconnect(doc: Document, socket: Socket): void {
    socket.on("disconnect", () => {
      doc.onDisconnect(socket);
    });
  }
}
