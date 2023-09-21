import { Schema, model, Document } from "mongoose"

interface IMessage {
  role: string
  content: string
}

interface IUser extends Document {
  username: string
  messages: IMessage[]
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true
  },
  messages: [
    {
      role: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      }
    }
  ]
})

const User = model<IUser>("User", userSchema)

export default User
