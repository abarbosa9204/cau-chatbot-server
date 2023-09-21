import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, Configuration, CreateCompletionRequestPrompt, OpenAIApi } from "openai"
import { configMessages } from "./configMessages"
import { RequiredError } from "openai/dist/base"

export class OpenAIClient {
  private readonly configuration: Configuration
  private readonly openAI: OpenAIApi
  private readonly messages: ChatCompletionRequestMessage[]
  private customModel?: string

  constructor() {
    this.configuration = new Configuration({ apiKey: process.env.OPEN_AI_KEY })
    this.openAI = new OpenAIApi(this.configuration)
    this.messages = configMessages
  }

  public async getLastModel(): Promise<string> {
    const lastModel = (await this.openAI.listModels()).data.data
      .filter(model => model.id.includes("equitel"))
      .sort((a, b) => a.created - b.created)
      .reverse()
      .shift()

    if (lastModel === undefined) throw new Error("No hay modelos personalizados en la cuenta de OpenAI activa")
    return lastModel.id
  }

  public async loadLastModel() {
    this.customModel = await this.getLastModel()
  }

  public async generateTextCompletion(prompt: CreateCompletionRequestPrompt): Promise<string> {
    if (this.customModel === undefined) throw new Error("El modelo personalizado no ha sido cargado aun")

    const createCompletionRequest = {
      prompt: `${prompt}\n\n###\n\n`,
      model: this.customModel,
      max_tokens: 1500,
      temperature: 0.2,
      stop: "END",
      n: 1
    }

    try {
      const responseText = (await this.openAI.createCompletion(createCompletionRequest)).data.choices[0].text
      if (responseText === undefined) throw new Error("Error: OpenAI no pudo generar un texto de respuesta")
      else return responseText
    } catch (error) {
      if (error instanceof RequiredError) throw new Error(`Error al obtener una respuesta de OpenAI: ${error.message}`)
      else if (error instanceof Error) throw error
      else throw new Error("Error desconocido al obtener una respuesta de OpenAI")
    }
  }

  public async generateChatCompletion(message: ChatCompletionRequestMessage): Promise<ChatCompletionResponseMessage[]> {
    const createChatCompletionRequest = {
      messages: [...this.messages, message],
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      n: 1
    }

    try {
      const responseMessage = (await this.openAI.createChatCompletion(createChatCompletionRequest)).data.choices[0].message
      if (responseMessage == undefined) throw new Error("Error al intentar obtener un mensaje de respuesta de OpenAI")
      this.messages.push(message)
      this.messages.push(responseMessage)
      return this.messages
    } catch (error) {
      if (error instanceof RequiredError) throw new Error(`Error al obtener una respuesta de OpenAI: ${error.message}`)
      else if (error instanceof Error) throw error
      else throw new Error("Error desconocido al obtener una respuesta de OpenAI")
    }
  }
}
