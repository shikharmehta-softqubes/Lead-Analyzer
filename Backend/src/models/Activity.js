import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const nullableGuid = {
  type: String,
  match: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  default: null,
};

const activitySchema = new mongoose.Schema(
  {
    ActivityID: {
      type: String,
      required: true,
      unique: true,
      default: randomUUID,
      match: nullableGuid.match,
    },
    ClientID: nullableGuid,
    OwnerID: nullableGuid,
    AssociationID: nullableGuid,
    AssociationType_Term: {
      type: String,
      maxlength: 165,
      default: null,
    },
    AssignTo: nullableGuid,
    OtherUsers: {
      type: String,
      default: null,
    },
    ActivityStatus_Term: {
      type: String,
      maxlength: 165,
      default: null,
    },
    ActivityType_Term: {
      type: String,
      maxlength: 165,
      default: null,
      alias: 'type',
    },
    Priority_Term: {
      type: String,
      maxlength: 165,
      default: null,
    },
    StartDate: {
      type: Date,
      default: null,
    },
    Duration: {
      type: Number,
      default: null,
    },
    EndDate: {
      type: Date,
      default: null,
    },
    EmailReminders_BeforeHrs: {
      type: Number,
      default: null,
    },
    ActivitySubject: {
      type: String,
      maxlength: 1067,
      default: null,
    },
    ActivityDetails: {
      type: String,
      default: null,
      alias: 'text',
    },
    DateOfCreated: {
      type: Date,
      default: Date.now,
    },
    AccountID: nullableGuid,
    SeqNo: {
      type: Number,
      required: true,
      default: 0,
    },
    UpdateLog: {
      type: Buffer,
      default: null,
    },
    UpdateOn: {
      type: Date,
      default: null,
    },
    UpdateBy: nullableGuid,
    IsActive: {
      type: Boolean,
      default: true,
    },
    IsBlock: {
      type: Boolean,
      default: false,
    },
    IsFollowUp: {
      type: Boolean,
      default: false,
    },
    FollowUpOnActivityID: nullableGuid,
    IsInComing: {
      type: Boolean,
      default: false,
    },
    ContactID: nullableGuid,
    EmailSendTo: {
      type: String,
      default: null,
    },
    HotelID: nullableGuid,
    StrDuration: {
      type: String,
      maxlength: 5,
      default: null,
    },
    ActivityTime: {
      type: String,
      maxlength: 20,
      default: null,
    },
    ReminderSendEmail: {
      type: Boolean,
      default: false,
    },
    AssigntoUserName: {
      type: String,
      maxlength: 165,
      default: null,
    },
    AccountName: {
      type: String,
      maxlength: 400,
      default: null,
    },
  },
  {
    collection: 'crm_Activities',
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

activitySchema.index({ AssociationID: 1 });
activitySchema.index({ AssignTo: 1 });
activitySchema.index({ StartDate: 1 });
activitySchema.index({ DateOfCreated: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
