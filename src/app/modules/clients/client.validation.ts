import { z } from "zod";

import { ClientStatus, ClientType } from "./client.interface";
import { ClientDocumentType } from "./clientDocument/clientDocument.interface";

const objectId = z
  .string({
    required_error: "ObjectId is required.",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

export const createClientValidationSchema = z.object({
 
    leadId: objectId.optional(),

    accountManager: objectId.optional(),

    clientType: z.nativeEnum(ClientType).optional(),

    companyName: z.string().trim().optional(),

    companyWebsite: z
      .string()
      .trim()
      .url("Please provide a valid website URL.")
      .optional(),

    industry: z.string().trim().optional(),

    companySize: z.string().trim().optional(),

    taxId: z.string().trim().optional(),

    clientCode: z.string().trim().min(1).optional(),

    status: z.nativeEnum(ClientStatus).optional(),

    joinedAt: z.string().datetime().optional(),

    lastContactAt: z.string().datetime().optional(),

    nextFollowUp: z.string().datetime().optional(),

    tags: z.array(z.string()).optional(),

    labels: z.array(z.string()).optional(),

    customFields: z.record(z.any()).optional(),
});

export const updateClientValidationSchema = z.object({
  body: z.object({
    accountManager: objectId.optional(),

    clientType: z.nativeEnum(ClientType).optional(),

    companyName: z.string().trim().optional(),

    companyWebsite: z
      .string()
      .trim()
      .url("Please provide a valid website URL.")
      .optional(),

    industry: z.string().trim().optional(),

    companySize: z.string().trim().optional(),

    taxId: z.string().trim().optional(),

    status: z.nativeEnum(ClientStatus).optional(),

    joinedAt: z.string().datetime().optional(),

    lastContactAt: z.string().datetime().optional(),

    nextFollowUp: z.string().datetime().optional(),

    tags: z.array(z.string()).optional(),

    labels: z.array(z.string()).optional(),

    customFields: z.record(z.any()).optional(),
  }),
});

export const addClientNoteValidationSchema = z.object({
 
    message: z
      .string()
      .trim()
      .min(1, "Note message is required.")
      .max(5000, "Note cannot exceed 5000 characters."),
});

export const addClientDocumentValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Document title is required."),

    url: z
      .string()
      .trim()
      .url("Please provide a valid document URL."),

    type: z
      .nativeEnum(ClientDocumentType)
      .optional(),
  }),
});

export const assignClientManagerValidationSchema = z.object({
  body: z.object({
    accountManager: objectId,
  }),
});

export const updateClientStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ClientStatus),
  }),
});
