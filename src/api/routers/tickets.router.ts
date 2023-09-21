import router from "express"
import { TicketsController } from "../controllers/tickets.controller"
import { validateEmail } from "../middlewares/email.middleware"
import { myGLPiClient } from "../../services/services-instances"
import { validateAppToken } from "../middlewares/auth.middleware"
import { handleErrors } from "../middlewares/error.middleware"

const ticketsRoute = "/api/v1/tickets"
const ticketsRouter = router()
const ticketsController = new TicketsController(myGLPiClient)

const createTicket = ticketsController.createTicket.bind(ticketsController)

ticketsRouter.post("/", validateAppToken, handleErrors, validateEmail, createTicket)

export { ticketsRoute, ticketsRouter }
