import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  DEVELOPER = "DEVELOPER",
  DESIGNER = "DESIGNER",
  MARKETER = "MARKETER",
  STAFF = "STAFF",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface IUser {
  _id?: Types.ObjectId;

  firstName: string;
  lastName: string;
  fullName?: string;

  email: string;
  password?: string;

  phone?: string;

  avatar?: string;

  address?: string;

  bio?: string;
  role: Role;

  designation?: string;

  department?: string;

  joiningDate?: Date;

  reportingManager?: Types.ObjectId;

  isVerified: boolean;

  status: UserStatus;

  permissions: string[];

  createdBy?: Types.ObjectId;

  updatedBy?: Types.ObjectId;

  deletedBy?: Types.ObjectId;

  deletedAt?: Date;

  isDeleted: boolean;

  lastLogin?: Date;

  passwordChangedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}
