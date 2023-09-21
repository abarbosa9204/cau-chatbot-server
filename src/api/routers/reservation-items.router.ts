import router from "express"
import { ReservationItemsController } from "../controllers/reservation-items.controller"
import { myGLPiClient } from "../../services/services-instances"
import { validateAppToken } from "../middlewares/auth.middleware"
import { handleErrors } from "../middlewares/error.middleware"

const reservationItemsRoute = "/api/v1/reservation_items"
const reservationItemsRouter = router()
const reservationItemsController = new ReservationItemsController(myGLPiClient)

const getAllReservationItems = reservationItemsController.getAllReservationItems.bind(reservationItemsController)

reservationItemsRouter.get("/", validateAppToken, handleErrors, getAllReservationItems)

export { reservationItemsRouter, reservationItemsRoute }
