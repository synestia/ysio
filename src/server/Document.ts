import * as Y from "yjs";
import { DocumentOptions } from "./types";
import { Namespace, Socket } from "socket.io";

const UPDATE_EMIT = "update-yjs";

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

  private onUpdate(update: Uint8Array, socket: Socket): void {
    if (this.DocumentOptions?.onUpdate !== undefined) {
      this.DocumentOptions.onUpdate(
        update,
        (update: Uint8Array) => {
          Y.applyUpdateV2(this, update);
          this.documentNamespace.emit(UPDATE_EMIT, update);
        },
        socket
      );
    } else {
      Y.applyUpdateV2(this, update);
      this.documentNamespace.emit(UPDATE_EMIT, update);
    }

    if (this.DocumentOptions?.persistence !== undefined) {
      this.DocumentOptions.persistence.writeState(this);
    }
  }

  private awarenessUpdate(awareness: Uint8Array, socket?: Socket): void {}

  private onDisconnect(socket: Socket): void {}
}
