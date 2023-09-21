import { Link } from "./Link"
import { Room } from "./ReservationItem"

export interface ReservationGLPi {
  id: number
  users_id: number
  reservationitems_id: number
  comment: string
  begin: string
  end: string
  link: Link
}

export interface ReservationDTO {
  id: number
  userId: number
  room: Room
  comment: string
  begin: Date
  end: Date
}

export interface ReservationRequest {
  email: string
  roomId: number
  begin: string
  end: string
  reason: string
}

export interface DateRange {
  begin: Date
  end: Date
}
