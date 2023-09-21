import { ItemType } from "./ItemType"

export interface CreateItemRequest {
  itemType: ItemType
  input: { [key: string]: string | number | boolean }
}
