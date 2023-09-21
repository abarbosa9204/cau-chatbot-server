import { Request, Response } from "express"

import { GLPiClient } from "../../services/GLPi/GLPiClient"
import { HttpError } from "../../domain/API/HttpError"

class UsersController {
  private readonly clientGLPi: GLPiClient

  async searchUser(request: Request, response: Response): Promise<void> {
    const email: string = request.params.email
    const user = await this.clientGLPi.searchUser(email)
    if (user === undefined) response.status(404).json("El usuario no fue encontrado en la base de datos")
    else response.json(user)
  }

  constructor(clientGLPi: GLPiClient) {
    this.clientGLPi = clientGLPi
  }
}

export { UsersController }
