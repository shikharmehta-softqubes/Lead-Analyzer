import HotelOffer from '../models/HotelOffer.js';

export const LEAD_SEGMENTS = ['Hot', 'Warm', 'Cold'];

const normalizeSegment = (segment) => {
  if (LEAD_SEGMENTS.includes(segment)) return segment;
  if (segment === 'High Potential' || segment === 'High Value') return 'Hot';
  if (segment === 'Qualified' || segment === 'Nurture') return 'Warm';
  if (segment === 'Low Priority' || segment === 'At Risk') return 'Cold';
  return 'Cold';
};

export const normalizeOfferRules = (rules = []) => {
  const incoming = Array.isArray(rules) ? rules : [];
  return LEAD_SEGMENTS.map((segment) => {
    const found = incoming.find((rule) => normalizeSegment(rule.leadSegment || rule.segment) === segment) || {};
    return {
      leadSegment: segment,
      initialOffer: found.initialOffer || '',
      followUpOffer: found.followUpOffer || '',
      autoFollowUpOffer: found.autoFollowUpOffer || found.followUpOffer || '',
    };
  });
};

export const findHotelOfferByIdentifier = async (identifier) => {
  if (!identifier) return null;

  return HotelOffer.findOne({
    IsActive: true,
    $or: [
      ...(String(identifier).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
      { HotelOfferID: identifier },
      { HotelCode: String(identifier).toUpperCase() },
      { HotelName: identifier },
    ],
  });
};

export const resolveConfiguredOffer = async ({
  hotelOfferId,
  hotelName,
  hotelCode,
  segment,
  mode = 'initial',
  customOffer,
}) => {
  if (customOffer && String(customOffer).trim()) {
    return {
      offerText: String(customOffer).trim(),
      source: 'custom',
      hotelOffer: null,
    };
  }

  const hotelOffer = await findHotelOfferByIdentifier(hotelOfferId || hotelCode || hotelName);
  if (!hotelOffer) {
    return { offerText: null, source: 'none', hotelOffer: null };
  }

  const normalizedSegment = normalizeSegment(segment);
  const rule = hotelOffer.OfferRules.find((item) => item.leadSegment === normalizedSegment);
  const fieldName = mode === 'auto-follow-up'
    ? null // Use DefaultOffer directly for auto-follow-up
    : mode === 'follow-up'
      ? 'followUpOffer'
      : 'initialOffer';

  const offerText = mode === 'auto-follow-up'
    ? (hotelOffer.DefaultOffer || rule?.autoFollowUpOffer || rule?.followUpOffer || null)
    : (rule?.[fieldName] || rule?.followUpOffer || hotelOffer.DefaultOffer || null);

  return {
    offerText,
    source: offerText ? 'hotel-configuration' : 'none',
    hotelOffer,
  };
};

export const buildOfferSnapshot = ({ hotelOffer, offerText, source, segment, mode }) => {
  if (!offerText) return null;

  return {
    hotelOfferId: hotelOffer?.HotelOfferID || null,
    hotelName: hotelOffer?.HotelName || null,
    hotelCode: hotelOffer?.HotelCode || null,
    maxDiscountPercent: hotelOffer?.MaxDiscountPercent ?? null,
    offerText,
    source,
    segment,
    mode,
    appliedOn: new Date(),
  };
};
