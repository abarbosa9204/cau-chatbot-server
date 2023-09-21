import { Request, Response } from "express"

import { GLPiClient } from "../../services/GLPi/GLPiClient"
import { CreateTicketRequest } from "../../domain/GLPi/Ticket"
import { HttpError } from "../../domain/API/HttpError"

class TicketsController {
  private readonly clientGLPi: GLPiClient

  async createTicket(req: Request, res: Response): Promise<void> {
    const requestData = req.body as CreateTicketRequest
    const itemCreationResponse = await this.clientGLPi.createTicket(requestData)
    res.json(itemCreationResponse)
  }

  constructor(clientGLPi: GLPiClient) {
    this.clientGLPi = clientGLPi
  }
}

export { TicketsController }
