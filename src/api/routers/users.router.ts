import router from "express"
import { UsersController } from "../controllers/users.controller"
import { validateEmail } from "../middlewares/email.middleware"
import { myGLPiClient } from "../../services/services-instances"
import { validateAppToken } from "../middlewares/auth.middleware"
import { handleErrors } from "../middlewares/error.middleware"

const usersRoute = "/api/v1/users"
const usersRouter = router()
const usersController = new UsersController(myGLPiClient)

const searchUser = usersController.searchUser.bind(usersController)

usersRouter.get("/:email", validateAppToken, handleErrors, validateEmail, searchUser)

export { usersRoute, usersRouter }
