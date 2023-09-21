import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from "openai"
import { Server } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"

import { AllowedOriginsManager } from "./AllowedOriginsManager"
import { OpenAIClient } from "../services/OpenAI/OpenAIClient"

enum EventNames {
  SENDING_MESSAGE = "sending_message",
  ERROR = "error"
}

export class ChatSocket {
  private io: SocketIOServer
  private readonly cors = {
    origin: AllowedOriginsManager.get(),
    methods: ["GET", "POST"]
  }

  constructor() {
    this.io = new SocketIOServer({ cors: this.cors })
  }

  /**
   * Añade las funcionalidades de autenticación al chat socket
   */
  public setupAuth(): void {
    this.io.use((socket, next) => {
      const authHeader = socket.handshake.auth["App-Token"]
      if (authHeader === undefined) {
        const noAuthError = new Error("No se encontraron datos de autenticación en la petición")
        return next(noAuthError)
      } else if (authHeader !== process.env.APP_TOKEN) {
        const authError = new Error("La conexión ha fallado porque los datos de autenticación no son correctos")
        return next(authError)
      } else {
        next()
      }
    })
  }

  /**
   * Configura el chat socket para que pueda enviar y recibir mensajes.
   * @param server el servidor ligado al chat socket
   * @param openAIClient el servicio encargado de comunicarse con OpenAI
   */
  public init(server: Server, openAIClient: OpenAIClient): void {
    this.io.attach(server)
    this.io.on("connection", (socket: Socket) => {
      console.log("Un nuevo usuario se ha conectado")

      socket.on(EventNames.SENDING_MESSAGE, async (message: ChatCompletionRequestMessage) => {
        if (message.content === undefined) {
          throw new Error("El contenido del mensaje dado es indefinido")
        } else {
          try {
            const responseText = await openAIClient.generateTextCompletion(message.content)
            const responseMessage: ChatCompletionResponseMessage = { role: "assistant", content: responseText }
            socket.emit(EventNames.SENDING_MESSAGE, responseMessage)
          } catch (error) {
            if (error instanceof Error) socket.emit(EventNames.ERROR, error.message)
          }
        }
      })

      socket.on("disconnect", () => {
        console.log("Un usuario se ha desconectado")
      })
    })
  }
}
