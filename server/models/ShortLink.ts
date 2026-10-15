import mongoose, { Schema, Document } from 'mongoose';

export interface IShortLink extends Document {
  code: string;
  originalUrl: string;
  title: string;
  domain: string;
  isMalicious: boolean;
  maliciousReasons: string[];
  clickCount: number;
  createdAt: Date;
  expiresAt: Date | null;
  allowDirectRedirect: boolean;
  reportsCount: number;
}

const ShortLinkSchema = new Schema<IShortLink>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      default: ''
    },
    domain: {
      type: String,
      default: ''
    },
    isMalicious: {
      type: Boolean,
      default: false
    },
    maliciousReasons: {
      type: [String],
      default: []
    },
    clickCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    allowDirectRedirect: {
      type: Boolean,
      default: true
    },
    reportsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const ShortLinkModel = mongoose.models.ShortLink || mongoose.model<IShortLink>('ShortLink', ShortLinkSchema);
