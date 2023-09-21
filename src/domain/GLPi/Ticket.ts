enum TicketFields {
  NAME = 1,
  ID = 2,
  DATE = 15,
  REQUESTER = 22,
  LOCATION = 83
}

export interface TicketGLPi {
  id: number
  users_id_recipient: number
  name: string
  content: string
}

export interface CreateTicketRequest {
  name: string
  content: string
  email: string
}

export interface TicketDTO {
  id: number
  name: string
  requester: string
  content?: string
  date: string
  location: string
}

export type TicketSearchItem = {
  [key in TicketFields]: string | number | boolean
}

export function ticketSearchItemToDTO(ticketData: TicketSearchItem) {
  return <TicketDTO>{
    id: +ticketData[TicketFields.ID],
    name: ticketData[TicketFields.NAME],
    requester: ticketData[TicketFields.REQUESTER],
    date: ticketData[TicketFields.DATE],
    location: ticketData[TicketFields.LOCATION]
  }
}
