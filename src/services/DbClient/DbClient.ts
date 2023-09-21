import { Db, MongoClient } from "mongodb"

export class DbClient {
  private readonly dbName: string // Database Name
  private readonly url?: string
  private readonly client: MongoClient
  private db?: Db

  constructor() {
    this.dbName = process.env.DB_NAME || "default"
    this.url = process.env.MONGO_URL
    if (this.url === undefined) throw new Error("The Url for Mongo Connect is undefined")
    this.client = new MongoClient(this.url)
  }

  async connect() {
    await this.client.connect().then(() => console.log("Connected successfully to server"))
    this.db = this.client.db(this.dbName)
  }
}
