import { Request, Response } from "express"
import { GLPiClient } from "../../services/GLPi/GLPiClient"
import { ReservationRequest } from "../../domain/GLPi/Reservation"
import { ReservationDTO } from "../../domain/GLPi/Reservation"
import { DeleteItemResponse } from "../../domain/GLPi/DeleteItemResponse"

class ReservationsController {
  private readonly clientGLPi: GLPiClient

  async getReservations(request: Request, response: Response): Promise<void> {
    const { email, roomId } = request.params
    let reservations = new Array<ReservationDTO>()
    if (email !== undefined) reservations = await this.clientGLPi.getReservationsByUser(email as string)
    else if (roomId !== undefined) reservations = await this.clientGLPi.getReservationsByRoom(+roomId)
    else reservations = await this.clientGLPi.getAllReservations()
    response.json(reservations)
  }

  async reserveRoom(request: Request, response: Response): Promise<void> {
    const reservationData = request.body as ReservationRequest
    const itemCreationResponse = await this.clientGLPi.reserveRoom(reservationData)
    response.json(itemCreationResponse)
  }

  async deleteReservation(request: Request, response: Response): Promise<void> {
    const reserveID = request.params.reserveID as string
    const reservationDeleted = await this.clientGLPi.deleteReservation(+reserveID)

    if (reservationDeleted) response.json(<DeleteItemResponse>{ status: "success", message: `Reserva con ID ${reserveID} eliminada exitosamente` })
    else response.status(500).json(<DeleteItemResponse>{ status: "failed", message: `La reserva con ID ${reserveID} no se pudo borrar.` })
  }

  constructor(clientGLPi: GLPiClient) {
    this.clientGLPi = clientGLPi
  }
}

export { ReservationsController }
