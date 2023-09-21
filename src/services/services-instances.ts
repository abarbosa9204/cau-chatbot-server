import { GLPiClient } from "./GLPi/GLPiClient"
import { OpenAIClient } from "./OpenAI/OpenAIClient"

const myGLPiClient = new GLPiClient()
const myOpenAIClient = new OpenAIClient()

myGLPiClient.init()
myOpenAIClient.loadLastModel()

export { myGLPiClient, myOpenAIClient }
