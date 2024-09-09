import * as Y from 'yjs';
import { DocumentOptions } from './types';
import { Namespace, Socket } from 'socket.io';

export class Document extends Y.Doc {
    public readonly name: string

    private DocumentOptions?: DocumentOptions

    private documentNamespace: Namespace

    constructor(name: string, documentNamespace: Namespace, documentOptions?: DocumentOptions) {
        super()
        this.name = name
        this.DocumentOptions = documentOptions
        this.documentNamespace = documentNamespace
    }

    private onUpdate(update: Uint8Array, socket?: Socket): void {

    }

    private awarenessUpdate(awareness: Uint8Array, socket?: Socket): void {

    }

    private onDisconnect(socket: Socket): void {
        
    }
}