import { ItemType } from "./ItemType"
import { Link } from "./Link"

export interface ReservationItem {
  id: number
  itemtype: ItemType
  comment: string | null
  links: Link[]
}

export interface Room {
  id: number
  name: string
  location: string
}
