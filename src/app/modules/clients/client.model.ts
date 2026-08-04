import { Schema, model } from "mongoose";

import { ClientStatus, ClientType, IClient } from "./client.interface";

const clientSchema = new Schema<IClient>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
      unique: true,
    },

    accountManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    clientType: {
      type: String,
      enum: Object.values(ClientType),
      default: ClientType.INDIVIDUAL,
    },

    companyName: String,

    companyWebsite: String,

    industry: String,

    companySize: String,

    taxId: String,

    clientCode: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(ClientStatus),
      default: ClientStatus.ACTIVE,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    totalProjects: {
      type: Number,
      default: 0,
    },

    completedProjects: {
      type: Number,
      default: 0,
    },

    activeProjects: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    totalInvoices: {
      type: Number,
      default: 0,
    },

    totalPaid: {
      type: Number,
      default: 0,
    },

    totalDue: {
      type: Number,
      default: 0,
    },

    lastContactAt: Date,

    nextFollowUp: Date,

    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: "ClientNote",
      },
    ],

    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "ClientDocument",
      },
    ],

    tags: [String],

    labels: [String],

    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Client = model<IClient>("Client", clientSchema);
