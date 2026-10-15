import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url?: string;
  contentBase64?: string;
}

export interface IMessage extends Document {
  messageId: string;
  inboxAddress: string;
  fromAddress: string;
  fromName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: Date;
  sizeBytes: number;
  headers: Record<string, string>;
  attachments: IAttachment[];
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    url: { type: String },
    contentBase64: { type: String }
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    inboxAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    fromAddress: {
      type: String,
      required: true,
      trim: true
    },
    fromName: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      default: '(No Subject)'
    },
    bodyText: {
      type: String,
      default: ''
    },
    bodyHtml: {
      type: String,
      default: ''
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      // Automatic TTL sweep: messages expire after 20 minutes if parent inbox has not already wiped them
      index: { expires: 1200 }
    },
    sizeBytes: {
      type: Number,
      default: 0
    },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    attachments: {
      type: [AttachmentSchema],
      default: []
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const MessageModel = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
