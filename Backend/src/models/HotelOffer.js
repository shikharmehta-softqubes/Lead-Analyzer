import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const nullableGuid = {
  type: String,
  match: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  default: null,
};

const offerRuleSchema = new mongoose.Schema(
  {
    leadSegment: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      required: true,
    },
    initialOffer: {
      type: String,
      default: null,
      trim: true,
    },
    followUpOffer: {
      type: String,
      default: null,
      trim: true,
    },
    autoFollowUpOffer: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const hotelOfferSchema = new mongoose.Schema(
  {
    HotelOfferID: {
      type: String,
      required: true,
      unique: true,
      default: randomUUID,
      match: nullableGuid.match,
    },
    HotelName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    HotelCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
    MaxDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    DefaultOffer: {
      type: String,
      default: null,
      trim: true,
    },
    OfferRules: {
      type: [offerRuleSchema],
      default: [],
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'crm_HotelOffer',
    timestamps: true,
  },
);

hotelOfferSchema.index({ HotelName: 1 }, { unique: true });
hotelOfferSchema.index({ HotelCode: 1 }, { sparse: true });
hotelOfferSchema.index({ IsActive: 1 });

const HotelOffer = mongoose.model('HotelOffer', hotelOfferSchema);

export default HotelOffer;
