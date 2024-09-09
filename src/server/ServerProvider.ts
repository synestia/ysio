import { Namespace, Server, Socket } from 'socket.io'
import { DocumentOptions, ServerProviderOptions } from './types'
import { Document } from './Document'

export class ServerProvider {
    private io: Server

    private documentOptions?: DocumentOptions
    private serverProviderOptions?: ServerProviderOptions
    
    private dynamicNamespace: Namespace

    private documents = new Map<string, Document>()

    constructor(io: Server, serverProviderOptions?: ServerProviderOptions, documentOptions?: DocumentOptions) {
        this.io = io
        this.documentOptions = documentOptions
        this.serverProviderOptions = serverProviderOptions
        this.dynamicNamespace = this.io.of(/^\/yjs-\d+$/)
    }

    public init(): void {
        // Middleware for authentication
        this.dynamicNamespace.use(async (socket, next) => {
            if(!this.serverProviderOptions?.authenticate) return next()
            if(await this.serverProviderOptions.authenticate(socket)) return next()
            else return next(new Error('Unauthorized'))
        })

        this.dynamicNamespace.on('connection', socket => {
            // cut everything to yjs-
            const name: string = socket.nsp.name.replace(/^\/yjs-/, '')
        })
    }

    private initDocument(name: string): Document {
        if(this.documents.has(name)) return this.documents.get(name) as Document
        
        const document = new Document(name, this.dynamicNamespace, this.documentOptions)
        this.documents.set(name, document)
        return document
    }

    private initSync(document: Document, socket: Socket): void {

    }

    private initSocketListeners(socket: Socket): void {
    }

    private initProxy(socket: Socket){

    }
}