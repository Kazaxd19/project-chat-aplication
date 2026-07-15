import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  profileImage?: string;
  role: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  role: { type: String, default: 'user' }
});

export default mongoose.model<IUser>('User', UserSchema);