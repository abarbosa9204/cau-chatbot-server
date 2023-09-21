import { Request, Response } from "express"
import { GLPiClient } from "../../services/GLPi/GLPiClient"
import { HttpError } from "../../domain/API/HttpError"

class ReservationItemsController {
  private readonly clientGLPi: GLPiClient

  constructor(clientGLPi: GLPiClient) {
    this.clientGLPi = clientGLPi
  }

  async getAllReservationItems(request: Request, response: Response): Promise<void> {
    const reservationItems = await this.clientGLPi.getAllReservationItems()
    response.json(reservationItems)
  }
}

export { ReservationItemsController }
