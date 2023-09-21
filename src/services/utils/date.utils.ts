import { DateRange } from "../../domain/GLPi/Reservation"

function areDatesNonOverlapping(date1: DateRange, date2: DateRange): boolean {
  return date2.begin >= date1.end || date1.begin >= date2.end
}

export { areDatesNonOverlapping }
