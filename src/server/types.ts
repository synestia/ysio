import { Socket } from "socket.io"
import { Document } from "./Document"

export type Persistence = {
    provider: any
    bindState: (doc: Document) => void
    writeState: (doc: Document) => void
}

export type DocumentOptions = {    
    onUpdate?(update: Uint8Array, next: (update: Uint8Array) => void, socket?: Socket): void | boolean | Promise<void | boolean>
    awarenessUpdate?(awareness: Uint8Array, socket?: Socket): void | Promise<void>
    onDisconnect?(socket: Socket): void | Promise<void>
    persistence?: Persistence
}

export type ServerProviderOptions = {
    authenticate?(socket: Socket): boolean | Promise<boolean>
}
