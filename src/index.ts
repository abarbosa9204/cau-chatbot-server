import * as dotenv from "dotenv"

import { Server } from "./server/Server"
import { ChatSocket } from "./server/ChatSocket"

dotenv.config()

const getErrorMessage = (variableName: string) => `El valor de '${variableName}' debe ser especificado en las variables de entorno`

if (process.env.APP_TOKEN === undefined) throw new Error(getErrorMessage("APP_TOKEN"))
if (process.env.OPEN_AI_KEY === undefined) throw new Error(getErrorMessage("OPEN_AI_KEY"))
if (process.env.GLPI_URL === undefined) throw new Error(getErrorMessage("GLPI_URL"))
if (process.env.GLPI_APP_TOKEN === undefined) throw new Error(getErrorMessage("GLPI_APP_TOKEN"))
if (process.env.GLPI_USER_TOKEN === undefined) throw new Error(getErrorMessage("GLPI_USER_TOKEN"))
if (process.env.EMAIL === undefined) throw new Error(getErrorMessage("EMAIL"))
if (process.env.PASS === undefined) throw new Error(getErrorMessage("PASS"))
if (process.env.PORT === undefined) throw new Error(getErrorMessage("PORT"))

const server = new Server()
const chatSocket = new ChatSocket()

server.setup()
server.configRoutes()
server.configSocket(chatSocket)
server.start(+process.env.PORT)
