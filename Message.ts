import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.js';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId | IUser;
  content: string;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IMessage>('Message', MessageSchema);