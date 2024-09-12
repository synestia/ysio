import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import {
  DocumentOptions,
  UPDATE_EMIT,
  PROXY_UPDATE_EMIT,
  AWARENESS_EMIT,
  next,
} from "./types";
import { Namespace, Socket } from "socket.io";

export class Document extends Y.Doc {
  public readonly name: string;

  private DocumentOptions?: DocumentOptions;

  private documentNamespace: Namespace;

  private awareness: awarenessProtocol.Awareness;

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
    }

    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.on("update", this.onAwarenessUpdate);
  }

  public syncDocument(socket: Socket): void {
    socket.emit(UPDATE_EMIT, Y.encodeStateAsUpdateV2(this));

    const encodedAwState = awarenessProtocol.encodeAwarenessUpdate(
      this.awareness,
      Array.from(this.awareness.getStates().keys())
    );

    socket.emit(AWARENESS_EMIT, encodedAwState);
  }

  public async onUpdate(update: Uint8Array, socket: Socket): Promise<void> {
    const next: next = (update: Uint8Array) => {
      Y.applyUpdateV2(this, update);
      this.documentNamespace.emit(UPDATE_EMIT, update);
    };

    if (this.DocumentOptions?.onUpdate !== undefined) {
      let result = this.DocumentOptions.onUpdate(update, next, socket);

      if (result instanceof Promise) {
        result = await result;
      }

      if (result instanceof Function) {
        result();
      }

      if (this.DocumentOptions?.persistence !== undefined) {
        this.DocumentOptions.persistence.writeState(this);
      }
    }
  }

  // The function is here due to having plans for having logic for multiple documents
  public async onProxyUpdate(
    update: Uint8Array,
    socket: Socket
  ): Promise<void> {
    const next: next = (update: Uint8Array) => {
      this.documentNamespace.emit(PROXY_UPDATE_EMIT, update);
    };

    if (this.DocumentOptions?.onProxyUpdate !== undefined) {
      let result = this.DocumentOptions.onProxyUpdate(update, next, socket);

      if (result instanceof Promise) {
        result = await result;
      }

      if (result instanceof Function) {
        result();
      }
    }
  }

  public async awarenessUpdate(
    update: Uint8Array,
    socket: Socket
  ): Promise<void> {
    const next: next = (update: Uint8Array) => {
      awarenessProtocol.applyAwarenessUpdate(this.awareness, update, socket);
    };

    if (this.DocumentOptions?.awarenessUpdate !== undefined) {
      let result = this.DocumentOptions.awarenessUpdate(
        update,
        next,
        socket as Socket
      );

      if (result instanceof Promise) {
        result = await result;
      }

      if (result instanceof Function) {
        result();
      }
    } else {
      next(update);
    }
  }

  private onAwarenessUpdate({ added, updated, removed }): void {
    const changedClients = added.concat(updated).concat(removed);
    this.documentNamespace.emit(
      AWARENESS_EMIT,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );
  }

  public onDisconnect(socket: Socket): void {
    // Check how many clients are still connected
    if (this.documentNamespace.sockets.size === 0) {
      // If a waitBeforeDestroy is set, wait before destroying the document
      if (this.DocumentOptions?.waitBeforeDestroy !== undefined) {
        setTimeout(() => {
          // Check if there are still no clients connected
          if (this.documentNamespace.sockets.size === 0) this.destroyDocument();
        }, this.DocumentOptions.waitBeforeDestroy);
      } else {
        // and then destroy it
        this.destroyDocument();
      }
    }
  }

  private destroyDocument(): void {
    if (this.DocumentOptions?.persistence !== undefined) {
      this.DocumentOptions.persistence.writeState(this);
    }
    this.awareness.off("update", this.onAwarenessUpdate);
    super.destroy();
  }

  public getNamespace(): Namespace {
    return this.documentNamespace;
  }
}
