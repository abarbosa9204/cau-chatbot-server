import router from "express"
import { ReservationsController } from "../controllers/reservations.controller"
import { validateEmail } from "../middlewares/email.middleware"
import { formatDates } from "../middlewares/date.middleware"
import { myGLPiClient } from "../../services/services-instances"
import { validateAppToken } from "../middlewares/auth.middleware"
import { handleErrors } from "../middlewares/error.middleware"

const reservationsRoute = "/api/v1/reservations"
const reservationsRouter = router()
const reservationsController = new ReservationsController(myGLPiClient)

const getReservations = reservationsController.getReservations.bind(reservationsController)
const reserveRoom = reservationsController.reserveRoom.bind(reservationsController)
const deleteReservation = reservationsController.deleteReservation.bind(reservationsController)

reservationsRouter.get("/", validateAppToken, handleErrors, getReservations)

reservationsRouter.get("/byUser/:email", validateAppToken, handleErrors, validateEmail, getReservations)

reservationsRouter.get("/byRoom/:roomId", validateAppToken, handleErrors, getReservations)

reservationsRouter.post("/", validateAppToken, handleErrors, validateEmail, formatDates, reserveRoom)

reservationsRouter.delete("/:reserveID", validateAppToken, handleErrors, deleteReservation)

export { reservationsRoute, reservationsRouter }
