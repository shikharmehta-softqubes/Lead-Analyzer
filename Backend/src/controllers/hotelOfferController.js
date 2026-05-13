import HotelOffer from '../models/HotelOffer.js';
import { findHotelOfferByIdentifier, normalizeOfferRules } from '../services/hotelOfferService.js';

const buildHotelOfferPayload = (body) => ({
  HotelName: body.HotelName || body.hotelName,
  HotelCode: body.HotelCode || body.hotelCode || null,
  MaxDiscountPercent: Number(body.MaxDiscountPercent ?? body.maxDiscountPercent ?? 0),
  DefaultOffer: body.DefaultOffer || body.defaultOffer || null,
  OfferRules: normalizeOfferRules(body.OfferRules || body.offerRules),
  IsActive: body.IsActive ?? body.isActive ?? true,
});

export const getHotelOffers = async (_req, res, next) => {
  try {
    const hotelOffers = await HotelOffer.find({ IsActive: true }).sort({ HotelName: 1 });
    res.json(hotelOffers);
  } catch (error) {
    next(error);
  }
};

export const getHotelOfferById = async (req, res, next) => {
  try {
    const hotelOffer = await findHotelOfferByIdentifier(req.params.id);
    if (!hotelOffer) return res.status(404).json({ message: 'Hotel offer configuration not found' });

    res.json(hotelOffer);
  } catch (error) {
    next(error);
  }
};

export const saveHotelOffer = async (req, res, next) => {
  try {
    const payload = buildHotelOfferPayload(req.body);
    if (!payload.HotelName) return res.status(400).json({ message: 'Hotel name is required' });

    const existing = req.params.id ? await findHotelOfferByIdentifier(req.params.id) : null;
    const hotelOffer = existing
      ? Object.assign(existing, payload)
      : new HotelOffer(payload);

    await hotelOffer.save();
    res.status(existing ? 200 : 201).json(hotelOffer);
  } catch (error) {
    next(error);
  }
};

export const deleteHotelOffer = async (req, res, next) => {
  try {
    const hotelOffer = await findHotelOfferByIdentifier(req.params.id);
    if (!hotelOffer) return res.status(404).json({ message: 'Hotel offer configuration not found' });

    hotelOffer.IsActive = false;
    await hotelOffer.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
