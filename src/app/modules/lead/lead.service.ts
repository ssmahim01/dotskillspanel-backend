import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

import { ILead, LeadStatus } from "./lead.interface";
import { Lead } from "./lead.model";
import { leadSearchableFields } from "./lead.constants";
import { User } from "../user/user.model";
import { Role } from "../user/user.interface";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";

const PROTECTED_FIELDS: (keyof ILead | string)[] = [
  "createdBy",
  "updatedBy",
  "deletedBy",
  "deletedAt",
  "isDeleted",
  "isConverted",
  "convertedAt",
  "convertedBy",
  "clientId",
  "attachments",
  "notes",
  "_id",
];

const stripProtectedFields = <T extends Record<string, any>>(
  payload: T,
): Partial<T> => {
  const sanitized: Record<string, any> = { ...payload };
  PROTECTED_FIELDS.forEach((field) => {
    delete sanitized[field as string];
  });
  return sanitized as Partial<T>;
};

const toObjectId = (id: string) => new Types.ObjectId(id);

const assertValidObjectId = (id: string, label = "Lead id") => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, `Invalid ${label}.`);
  }
};

const assertLeadExists = async (leadId: string) => {
  assertValidObjectId(leadId);

  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });

  if (!lead) {
    throw new AppError(httpStatus.NOT_FOUND, "Lead not found.");
  }

  return lead;
};

const assertAssigneeExists = async (userId: string) => {
  assertValidObjectId(userId, "assignedTo id");

  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "The user you are trying to assign this lead to does not exist.",
    );
  }

  return user;
};

const buildDateFilter = (query: Record<string, string>) => {
  const dateFilter: Record<string, Date> = {};

  if (query["createdAt[gte]"]) {
    dateFilter.$gte = new Date(query["createdAt[gte]"]) as unknown as Date;
  }

  if (query["createdAt[lte]"]) {
    dateFilter.$lte = new Date(query["createdAt[lte]"]) as unknown as Date;
  }

  return Object.keys(dateFilter).length ? dateFilter : undefined;
};

const sanitizeQuery = (query: Record<string, string>) => {
  const sanitized = { ...query };
  delete sanitized["createdAt[gte]"];
  delete sanitized["createdAt[lte]"];
  return sanitized;
};

const populateOptions = [
  { path: "assignedTo", select: "firstName lastName email designation" },
  { path: "createdBy", select: "firstName lastName email" },
  { path: "updatedBy", select: "firstName lastName email" },
  { path: "convertedBy", select: "firstName lastName email" },
  { path: "notes.createdBy", select: "firstName lastName email" },
];

const createLead = async (payload: Partial<ILead>, decodedToken: JwtPayload) => {
  if (payload.assignedTo) {
    await assertAssigneeExists(payload.assignedTo as unknown as string);
  }

  const lead = await Lead.create({
    ...payload,
    createdBy: toObjectId(decodedToken.userId),
  });

  return { data: lead };
};

const getLeads = async (query: Record<string, string>) => {
  const dateFilter = buildDateFilter(query);

  const baseFilter: Record<string, any> = { isDeleted: false };

  if (dateFilter) {
    baseFilter.createdAt = dateFilter;
  }

  const queryBuilder = new QueryBuilder(Lead.find(baseFilter), sanitizeQuery(query));

  const leadsQuery = queryBuilder
    .filter()
    .search(leadSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    leadsQuery.build().populate(populateOptions),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const getDeletedLeads = async (query: Record<string, string>) => {
  const dateFilter = buildDateFilter(query);

  const baseFilter: Record<string, any> = { isDeleted: true };

  if (dateFilter) {
    baseFilter.createdAt = dateFilter;
  }

  const queryBuilder = new QueryBuilder(Lead.find(baseFilter), sanitizeQuery(query));

  const leadsQuery = queryBuilder
    .filter()
    .search(leadSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    leadsQuery.build().populate(populateOptions),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const getLeadById = async (id: string) => {
  assertValidObjectId(id);

  const lead = await Lead.findOne({ _id: id, isDeleted: false }).populate(
    populateOptions,
  );

  if (!lead) {
    throw new AppError(httpStatus.NOT_FOUND, "Lead not found.");
  }

  return { data: lead };
}; 

const updateLead = async (
  leadId: string,
  payload: Partial<ILead>,
  decodedToken: JwtPayload,
) => {
  await assertLeadExists(leadId);

  const sanitizedPayload = stripProtectedFields(payload);

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      ...sanitizedPayload,
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const updateLeadStatus = async (
  leadId: string,
  status: LeadStatus,
  decodedToken: JwtPayload,
) => {
  await assertLeadExists(leadId);

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      status,
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const assignLead = async (
  leadId: string,
  assignedTo: string,
  decodedToken: JwtPayload,
) => {
  await assertLeadExists(leadId);
  await assertAssigneeExists(assignedTo);

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      assignedTo: toObjectId(assignedTo),
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const addNote = async (
  leadId: string,
  message: string,
  decodedToken: JwtPayload,
) => {
  await assertLeadExists(leadId);

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      $push: {
        notes: {
          message,
          createdBy: toObjectId(decodedToken.userId),
          createdAt: new Date(),
        },
      },
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const addAttachment = async (
  leadId: string,
  payload: { title: string; url: string; type?: string },
  decodedToken: JwtPayload,
) => {
  await assertLeadExists(leadId);

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      $push: {
        attachments: {
          title: payload.title,
          url: payload.url,
          type: payload.type,
          uploadedAt: new Date(),
        },
      },
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const convertLead = async (
  leadId: string,
  payload: { clientId?: string },
  decodedToken: JwtPayload,
) => {
  const lead = await assertLeadExists(leadId);

  if (lead.isConverted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This lead has already been converted.",
    );
  }

  if (payload.clientId) {
    assertValidObjectId(payload.clientId, "clientId");
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      isConverted: true,
      convertedAt: new Date(),
      convertedBy: toObjectId(decodedToken.userId),
      clientId: payload.clientId ? toObjectId(payload.clientId) : undefined,
      status: LeadStatus.WON,
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true, runValidators: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const softDeleteLead = async (leadId: string, decodedToken: JwtPayload) => {
  await assertLeadExists(leadId);

  await Lead.findByIdAndUpdate(leadId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: toObjectId(decodedToken.userId),
  });

  return { data: null };
};

const restoreLead = async (leadId: string, decodedToken: JwtPayload) => {
  assertValidObjectId(leadId);

  const lead = await Lead.findOne({ _id: leadId, isDeleted: true });

  if (!lead) {
    throw new AppError(httpStatus.NOT_FOUND, "Deleted lead not found.");
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedBy: toObjectId(decodedToken.userId),
    },
    { new: true },
  ).populate(populateOptions);

  return { data: updatedLead };
};

const permanentlyDeleteLead = async (
  leadId: string,
  decodedToken: JwtPayload,
) => {
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only a Super Admin can permanently delete a lead.",
    );
  }

  assertValidObjectId(leadId);

  const lead = await Lead.findOne({ _id: leadId, isDeleted: true });

  if (!lead) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only already soft-deleted leads can be permanently deleted.",
    );
  }

  await Lead.findByIdAndDelete(leadId);

  return { data: null };
};

export const LeadServices = {
  createLead,
  getLeads,
  getDeletedLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  addNote,
  addAttachment,
  convertLead,
  softDeleteLead,
  restoreLead,
  permanentlyDeleteLead,
};