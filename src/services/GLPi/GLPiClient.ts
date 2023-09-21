import axios, { AxiosError, AxiosInstance } from "axios"
import dotenv from "dotenv"

import { CreateItemRequest } from "../../domain/GLPi/CreateItemRequest"
import { CreateItemResponse } from "../../domain/GLPi/CreateItemResponse"
import { GLPiUser } from "../../domain/GLPi/GLPiUser"
import { ItemType } from "../../domain/GLPi/ItemType"
import { SessionToken } from "../../domain/GLPi/SessionToken"
import { ReservationGLPi, ReservationDTO, ReservationRequest, DateRange } from "../../domain/GLPi/Reservation"
import { ReservationItem, Room } from "../../domain/GLPi/ReservationItem"
import { areDatesNonOverlapping } from "../Utils/date.utils"
import { CreateTicketRequest } from "../../domain/GLPi/Ticket"
import { HttpError } from "../../domain/API/HttpError"

dotenv.config()

export class GLPiClient {
  private readonly httpClient: AxiosInstance

  /**
   * Crea una nueva instancia de GLPiClient con un cliente http personalizado
   */
  constructor() {
    this.httpClient = axios.create({
      baseURL: process.env.GLPI_URL,
      headers: {
        "App-Token": process.env.GLPI_APP_TOKEN,
        "Authorization": `user_token ${process.env.GLPI_USER_TOKEN}`
      }
    })
  }

  /**
   * Configura la instancia de GLPiClient con un session-token nuevo y un perfil de super-admin
   */
  public async init() {
    await this.initSession()
    await this.changeActiveProfile(4)
  }

  /**
   * Establece un nuevo session token de GLPi
   */
  private async initSession(): Promise<void> {
    try {
      const { session_token } = (await this.httpClient.post<SessionToken>("initSession", null)).data
      this.httpClient.defaults.headers.common["Session-Token"] = session_token
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError("Se detecto un error en la solicitud http al momento de obtener el session token", status)
        if (status === 401) throw new HttpError("No tienes permiso para acceder obtener un session token de GLPi", status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar ejecutar la acción para obtener el session token", 500)
      }
    }
  }

  /**
   * Establece el perfil con el id dado como el perfil activo
   * @param profileID El id del perfil que va pasar a estar activo
   * @throws {Error} Lanza un error si no se puede establecer el perfil con el id dado como el perfil activo
   */
  private async changeActiveProfile(profileID: number): Promise<void> {
    try {
      const requestBody = { profiles_id: profileID.toString() }
      return await this.httpClient.post("changeActiveProfile", requestBody)
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError(`Se detecto un error en la solicitud http al momento de intentar cambiar al perfil con id ${profileID}`, status)
        if (status === 404) throw new HttpError(`El perfil con id ${profileID} no existe o ya no está disponible`, status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar cambiar el perfil activo", 500)
      }
    }
  }

  /**
   * Busca un usuario en la base de datos a partir de su email
   * @param email el email del usuario a buscar
   * @returns el usuario encontrado o undefined, si el usuario no existe
   */
  public async searchUser(email: string): Promise<GLPiUser | undefined> {
    try {
      const username = email.split("@")[0]
      let foundUser: GLPiUser | undefined

      const pageSize = 100
      let hasMoreUsers = true

      for (let i = 0; hasMoreUsers; i += pageSize) {
        const { data: users } = await this.httpClient.get<GLPiUser[]>(`${ItemType.USER}?range=${i}-${i + pageSize - 1}`)
        foundUser = users.find(u => u.name === username)
        if (foundUser !== undefined || users.length < pageSize) hasMoreUsers = false
      }

      return foundUser
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError(`Se detecto un error en la solicitud http al momento de intentar buscar el usuario con email ${email}`, status)
        if (status === 401) throw new HttpError("No tienes permisos para acceder a la lista de usuarios", status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError(`Ocurrió un error inesperado al intentar buscar el usuario con email ${email}`, 500)
      }
    }
  }

  /**
   * Crea un nuevo ticket a partir de los datos dados
   * @param ticketData Un objeto con los datos del ticket a crear
   * @returns Un objeto con el id del ticket creado y el mensaje de creación
   * @throws {Error} Lanza un error si no se pudo crear el ticket
   */
  public async createTicket(requestData: CreateTicketRequest) {
    const requester = await this.searchUser(requestData.email)
    if (requester === undefined) throw new HttpError(`No se pudo encontrar ningún usuario con el correo ${requestData.email}`, 404)

    try {
      const ticket: CreateItemRequest = {
        itemType: ItemType.TICKET,
        input: {
          _users_id_recipient: requester.id,
          name: requestData.name,
          content: requestData.content,
          type: 1,
          urgency: 3,
          priority: 3
        }
      }

      const responseData = (await this.httpClient.post<CreateItemResponse>("Ticket", ticket)).data
      return responseData
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError("Se detecto un error en la solicitud http al momento de intentar crear el ticket con los datos proporcionados", status)
        if (status === 401) throw new HttpError("No tienes permiso para crear nuevos tickets", status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar crear el ticket", 500)
      }
    }
  }

  /**
   * Obtiene todas las salas disponibles para reservar
   * @returns Una lista con todas las salas disponibles
   */
  public async getAllReservationItems() {
    try {
      const rooms = new Array<Room>()
      const { data: reservationItems } = await this.httpClient.get<ReservationItem[]>(`${ItemType.RESERVATION_ITEM}?range=0-50`)

      for (const item of reservationItems) {
        const url = item.links.find(l => l.rel === "Peripheral")?.href
        if (!url) throw new HttpError(`No pudimos acceder a los datos de la sala con ID ${item.id}`, 404)
        const { data } = await this.httpClient.get(url)
        const room: Room = { id: item.id, name: data.name, location: await this.getLocationName(data.locations_id) }
        rooms.push(room)
      }

      return rooms
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status ?? 500
        if (status === 400) new HttpError("Se detecto un error en la solicitud http al momento de intentar obtener los items reservables", 400)
        if (status === 401) new HttpError("No tienes permiso para obtener los items reservables", 401)
        throw new HttpError(err.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar obtener los items reservables", 500)
      }
    }
  }

  /**
   * Obtiene un reservation item a partir de un ID
   * @returns Devuelve el reservation item con el ID dado como parámetro
   */
  async getReservationItemById(reservationItemID: number): Promise<Room> {
    try {
      const { data: reservationItem } = await this.httpClient.get<ReservationItem>(`${ItemType.RESERVATION_ITEM}/${reservationItemID}`)
      const url = reservationItem.links.find(l => l.rel === "Peripheral")?.href
      if (!url) throw new HttpError(`No pudimos acceder a los datos de la sala con ID ${reservationItemID}`, 404)
      const { data: peripheral } = await this.httpClient.get(url)
      const room: Room = { id: reservationItem.id, name: peripheral.name, location: await this.getLocationName(peripheral.locations_id) }
      return room
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status ?? 500
        if (status === 401) throw new HttpError(`No tienes permiso para acceder a los datos de la sala con id ${reservationItemID}`, status)
        if (status === 404) throw new HttpError(`No se pudo encontrar ninguna sala con id ${reservationItemID}`, status)
        throw new HttpError(err.message, status)
      } else {
        throw new HttpError(`Ocurrió un error inesperado al intentar acceder al item reservable con id ${reservationItemID}`, 500)
      }
    }
  }

  /**
   * Obtiene el nombre de una locación a partir de su ID
   * @param locationID El ID de la locación a buscar
   * @returns El nombre de la locación correspondiente al ID dado
   */
  public async getLocationName(locationID: number): Promise<string> {
    try {
      const { completename: completeName } = (await this.httpClient.get<{ completename: string }>(`Location/${locationID}`)).data
      return completeName
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status ?? 500
        if (err.status === 401) throw new HttpError(`No tienes permiso para acceder a los datos de la locación con id ${locationID}`, status)
        if (err.status === 404) throw new HttpError(`No se pudo encontrar ninguna locación con id ${locationID}`, status)
        throw new HttpError(err.message, status)
      } else {
        throw new HttpError(`Hubo un error desconocido al intentar obtener los datos de la locación con id ${locationID}`, 500)
      }
    }
  }

  /**
   * Obtiene todas las reservas registradas con fecha mayor al dia actual
   * @returns una lista de las reservas con fecha mayor al dia actual
   */
  public async getAllReservations(): Promise<ReservationDTO[]> {
    try {
      let hasMore = true
      const pageSize = 100
      const reservationsGLPi = new Array<ReservationGLPi>()

      for (let i = 0; hasMore; i += pageSize) {
        const filterByDate = (reservationGLPi: ReservationGLPi) => new Date(reservationGLPi.begin) > new Date()
        const filteredReservations = (await this.httpClient.get<ReservationGLPi[]>(`${ItemType.RESERVATION}?range=${i}-${i + pageSize - 1}&order=DESC`)).data.filter(filterByDate)
        reservationsGLPi.push(...filteredReservations)
        if (filteredReservations.length < pageSize) hasMore = false
      }

      const reservationsPromises = reservationsGLPi.map<Promise<ReservationDTO>>(async r => ({
        id: r.id,
        room: await this.getReservationItemById(r.reservationitems_id),
        userId: r.users_id,
        comment: r.comment,
        begin: new Date(r.begin),
        end: new Date(r.end)
      }))

      const reservationsDTOs = await Promise.all(reservationsPromises)
      return reservationsDTOs
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError("Se detecto un error en la solicitud http al momento de acceder a la lista de reservas actuales", status)
        if (status === 401) throw new HttpError("No estás autorizado para acceder a la lista de reservas actuales", status)
        throw new HttpError(error.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar obtener las reservas actuales", 500)
      }
    }
  }

  /**
   * Obtiene todas las reservas que ha hecho el usuario propietario del email dado como parámetro
   * @param email el email del usuario
   * @returns una lista con las reservas del usuario propietario del email
   */
  public async getReservationsByUser(email: string): Promise<ReservationDTO[]> {
    const user = await this.searchUser(email)
    if (user === undefined) throw new HttpError(`No se pudo encontrar un usuario con el email ${email} en la base de datos`, 404)
    return (await this.getAllReservations()).filter(r => r.userId == user.id)
  }

  /**
   * Obtiene todas las reservas registradas para una sala a partir de su ID
   * @param email el ID de la sala de la que se buscan las reservas
   * @returns una lista con las reservas hechas para la sala con el id dado como parámetro
   */
  public async getReservationsByRoom(roomId: number): Promise<ReservationDTO[]> {
    return (await this.getAllReservations()).filter(r => r.room.id === roomId)
  }

  /**
   * Valida la disponibilidad de una sala a partir de los datos de la reserva
   * @param requestData un objeto con los datos de la reserva
   * @throws {HttpError} si la sala que se quiere reservar no está disponible en el intervalo solicitado.
   */
  async validateRoomDisposability(requestData: ReservationRequest) {
    const begin = new Date(requestData.begin)
    const end = new Date(requestData.end)
    const newReservationDateRange = { begin, end }
    const registeredReservations = await this.getReservationsByRoom(requestData.roomId)
    for (const oldReservation of registeredReservations) {
      const oldReservationDateRange: DateRange = { begin: oldReservation.begin, end: oldReservation.end }
      if (!areDatesNonOverlapping(newReservationDateRange, oldReservationDateRange)) throw new HttpError("La sala que quieres reservar ya está ocupada en el intervalo solicitado", 400)
    }
  }

  /**
   * Reserva una sala luego de hacer las validaciones pertinentes
   * @param requestData los datos de la reserva
   * @returns Un objeto con los datos de la respuesta de la solicitud
   */
  public async reserveRoom(requestData: ReservationRequest): Promise<CreateItemResponse> {
    const { email, roomId, begin, end, reason } = requestData

    //validar que el usuario exista en la base de datos
    const user = await this.searchUser(email)
    if (user === undefined) throw new HttpError(`No se pudo encontrar un usuario con el email ${email} en la base de datos`, 404)

    //validar la disponibilidad de las salas
    await this.validateRoomDisposability(requestData)

    const reservation: CreateItemRequest = {
      itemType: ItemType.RESERVATION,
      input: { users_id: user.id, reservationitems_id: roomId, begin, end, comment: reason }
    }

    try {
      const { data: creationItemResponse } = await this.httpClient.post<CreateItemResponse>(ItemType.RESERVATION, reservation)
      return creationItemResponse
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError("Se detecto un error en la solicitud http al momento de reservar la sala", status)
        if (status === 401) throw new HttpError("No tienes permiso para reservar salas", status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError("Ocurrió un error inesperado al intentar hacer la reserva", 500)
      }
    }
  }

  /**
   * Borrar una reserva a partir de su ID
   * @param reservationID ID de la reserva a eliminar
   * @returns true o false dependiendo del resultado de la operación
   */
  public async deleteReservation(reservationID: number): Promise<boolean> {
    try {
      const { status } = await this.httpClient.delete(`${ItemType.RESERVATION}/${reservationID}`)
      return status === 200 || status === 204 || status === 207
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        if (status === 400) throw new HttpError(`Se detecto un error en la solicitud http al momento de intentar eliminar la reserva con id ${reservationID}`, status)
        if (status === 401) throw new HttpError("No tienes permiso para eliminar reservar", status)
        if (status === 404) throw new HttpError(`La reserva con el ID ${reservationID} no existe`, status)
        else throw new HttpError(error.message, status)
      } else {
        throw new HttpError(`Ocurrió un error inesperado al intentar borrar la reserva con id ${reservationID}`, 500)
      }
    }
  }
}
