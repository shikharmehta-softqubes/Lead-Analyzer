import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const nullableGuid = {
  type: String,
  match: /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[0-9a-fA-F]{24}|)$/,
  default: null,
};

const leadSchema = new mongoose.Schema(
  {
    LeadID: {
      type: String,
      required: true,
      unique: true,
      default: randomUUID,
      match: nullableGuid.match,
    },
    LeadNo: {
      type: String,
      maxlength: 65,
      default: null,
    },
    ClientID: nullableGuid,
    OwnerID: nullableGuid,
    CreatedOn: {
      type: Date,
      default: Date.now,
    },
    CompanyName: {
      type: String,
      maxlength: 365,
      default: null,
      alias: 'companyName',
    },
    FirstName: {
      type: String,
      maxlength: 365,
      default: null,
      alias: 'firstName',
    },
    LastName: {
      type: String,
      maxlength: 365,
      default: null,
      alias: 'lastName',
    },
    TelephoneNo: {
      type: String,
      maxlength: 67,
      default: null,
      alias: 'telephoneNo',
    },
    MobileNo: {
      type: String,
      maxlength: 67,
      default: null,
      alias: 'mobileNumber',
    },
    Email: {
      type: String,
      maxlength: 165,
      lowercase: true,
      trim: true,
      default: null,
      alias: 'email',
    },
    Website: {
      type: String,
      maxlength: 165,
      default: null,
    },
    Address: {
      type: String,
      maxlength: 365,
      default: null,
    },
    Street: {
      type: String,
      maxlength: 365,
      default: null,
    },
    City: {
      type: String,
      maxlength: 365,
      default: null,
    },
    State: {
      type: String,
      maxlength: 365,
      default: null,
    },
    Country: {
      type: String,
      maxlength: 365,
      default: null,
    },
    Zipcode: {
      type: String,
      maxlength: 17,
      default: null,
    },
    Lead_Status_Term: {
      type: String,
      maxlength: 165,
      default: null,
    },
    Status: {
      type: String,
      enum: ['Closed', 'Pending', 'Follow-up'],
      default: 'Pending',
    },
    Lead_Source_Term: {
      type: String,
      maxlength: 165,
      default: null,
    },
    LastContactedOn: {
      type: Date,
      default: null,
    },
    LastContactedBy: nullableGuid,
    LeadRatings: {
      type: Number,
      default: null,
      alias: 'score',
    },
    AISegment: {
      type: String,
      default: null,
    },
    AIRecommendation: {
      type: String,
      default: null,
    },
    AIRecommendations: {
      type: [String],
      default: [],
    },
    AIScoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    AISignals: {
      type: [String],
      default: [],
    },
    AIRisks: {
      type: [String],
      default: [],
    },
    AIScoreUpdatedOn: {
      type: Date,
      default: null,
    },
    ReferenceItem: nullableGuid,
    ReferenceBy: {
      type: String,
      maxlength: 165,
      default: null,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    Updatelog: {
      type: Buffer,
      default: null,
    },
    SeqNo: {
      type: Number,
      required: true,
      default: 0,
    },
    TerriterlyID: nullableGuid,
    PropertyID: {
      type: String,
      default: null,
    },
    SelectedHotelOfferID: nullableGuid,
    SelectedHotelName: {
      type: String,
      maxlength: 180,
      default: null,
      alias: 'selectedHotelName',
    },
    SelectedHotelCode: {
      type: String,
      maxlength: 40,
      default: null,
      alias: 'selectedHotelCode',
    },
    AppliedOffer: {
      hotelOfferId: {
        type: String,
        default: null,
      },
      hotelName: {
        type: String,
        default: null,
      },
      hotelCode: {
        type: String,
        default: null,
      },
      maxDiscountPercent: {
        type: Number,
        default: null,
      },
      offerText: {
        type: String,
        default: null,
      },
      source: {
        type: String,
        default: null,
      },
      segment: {
        type: String,
        default: null,
      },
      mode: {
        type: String,
        default: null,
      },
      appliedOn: {
        type: Date,
        default: null,
      },
    },
    DOSID: nullableGuid,
    Priority: {
      type: String,
      maxlength: 165,
      default: null,
      alias: 'mainPriority',
    },
    Comment: {
      type: String,
      default: null,
      alias: 'specialRequirements',
    },
    IsConvertAcc: {
      type: Boolean,
      default: false,
    },
    IsGroup: {
      type: Boolean,
      default: false,
    },
    GroupType: {
      type: String,
      maxlength: 300,
      default: null,
      alias: 'groupType',
    },
    Ext: {
      type: String,
      maxlength: 10,
      default: null,
    },
    AccountID: nullableGuid,
    LastActivityDate: {
      type: Date,
      default: null,
    },
    ThreadID: {
      type: String,
      maxlength: 40,
      default: null,
    },
    ThreadUpdateOn: {
      type: Date,
      default: null,
    },
    SubmittedBy: {
      type: String,
      maxlength: 365,
      default: null,
    },
    Title: {
      type: String,
      maxlength: 67,
      default: null,
    },
    InputDetails: {
      eventPurpose: {
        type: String,
        default: null,
      },
      guestCount: {
        type: Number,
        default: null,
      },
      roomsCount: {
        type: Number,
        default: null,
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      budgetRange: {
        type: String,
        default: null,
      },
      preferredLocation: {
        type: String,
        default: null,
      },
      decisionTimeline: {
        type: String,
        default: null,
      },
      contactMethod: {
        type: String,
        default: null,
      },
    },
  },
  {
    collection: 'crm_Lead',
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

leadSchema.index({ LeadNo: 1 });
leadSchema.index({ Email: 1 });
leadSchema.index({ CompanyName: 1 });
leadSchema.index({ Status: 1 });
leadSchema.index({ SelectedHotelOfferID: 1 });
leadSchema.index({ CreatedOn: -1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
