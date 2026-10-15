import mongoose, { Schema, Document } from 'mongoose';

export interface IInbox extends Document {
  address: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  isBlocked: boolean;
}

const InboxSchema = new Schema<IInbox>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB native TTL index: automatically deletes document when expiresAt timestamp arrives
      index: { expires: 0 }
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const InboxModel = mongoose.models.Inbox || mongoose.model<IInbox>('Inbox', InboxSchema);
