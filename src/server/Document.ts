import * as Y from "yjs";
import { DocumentOptions, UPDATE_EMIT, next } from "./types";
import { Namespace, Socket } from "socket.io";

export class Document extends Y.Doc {
  public readonly name: string;

  private DocumentOptions?: DocumentOptions;

  private documentNamespace: Namespace;

  constructor(
    name: string,
    documentNamespace: Namespace,
    documentOptions?: DocumentOptions
  ) {
    super();
    this.name = name;
    this.DocumentOptions = documentOptions;
    this.documentNamespace = documentNamespace;

    if (this.DocumentOptions?.persistence !== undefined) {
      // Load state from persistence
      this.DocumentOptions.persistence.bindState(this);
      // Emit initial state
      this.documentNamespace.emit(UPDATE_EMIT, Y.encodeStateAsUpdate(this));
    }
  }

  public async onUpdate(update: Uint8Array, socket: Socket): Promise<void> {
    const next: next = (update: Uint8Array) => {
      Y.applyUpdateV2(this, update);
      this.documentNamespace.emit(UPDATE_EMIT, update);
    };

    if (this.DocumentOptions?.onUpdate !== undefined) {
      const result = await this.DocumentOptions.onUpdate(update, next, socket);

      if (result instanceof Function) {
        result();
      }
    } else {
      next(update);
    }

    if (this.DocumentOptions?.persistence !== undefined) {
      this.DocumentOptions.persistence.writeState(this);
    }
  }

  public awarenessUpdate(awareness: Uint8Array, socket?: Socket): void {}

  public onDisconnect(socket: Socket): void {}

  public getNamespace(): Namespace {
    return this.documentNamespace;
  }
}
