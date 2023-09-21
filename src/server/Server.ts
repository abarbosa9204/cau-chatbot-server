import express, { Application } from "express"
import http from "http"
import cors from "cors"
import { ticketsRoute, ticketsRouter } from "../api/routers/tickets.router"
import { AllowedOriginsManager } from "./AllowedOriginsManager"
import { reservationsRoute, reservationsRouter } from "../api/routers/reservations.router"
import { usersRoute, usersRouter } from "../api/routers/users.router"
import { reservationItemsRoute, reservationItemsRouter } from "../api/routers/reservation-items.router"
import { ChatSocket } from "./ChatSocket"
import { myOpenAIClient } from "../services/services-instances"
import { handleErrors } from "../api/middlewares/error.middleware"
import { validateAppToken } from "../api/middlewares/auth.middleware"

export class Server {
  private app: Application
  private httpServer: http.Server

  constructor() {
    this.app = express()
    this.httpServer = http.createServer(this.app)
  }

  /**
   * Establece la configuración inicial del servidor
   */
  setup(): void {
    this.app.use(cors({ origin: AllowedOriginsManager.get(), optionsSuccessStatus: 200 }))
    this.app.use(express.static("public"))
    this.app.use(express.json())
  }

  /**
   * Configura los endpoints del servidor
   */
  configRoutes(): void {
    this.app.use(ticketsRoute, ticketsRouter)
    this.app.use(reservationsRoute, reservationsRouter)
    this.app.use(usersRoute, usersRouter)
    this.app.use(reservationItemsRoute, reservationItemsRouter)
  }

  /**
   * Configura el chat socket ligado al servidor http
   * @param socket la instancia del socket a configurar
   */
  configSocket(socket: ChatSocket) {
    socket.setupAuth()
    socket.init(this.httpServer, myOpenAIClient)
  }

  /**
   * Inicia el servidor en el puerto que se recibe como parámetro
   * @param port El numero de puerto donde se va configurar el servidor
   */
  public start(port: number): void {
    this.httpServer.listen(port, () => {
      console.log(`Servidor activo en el puerto ${port}`)
    })
  }
}
