import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { analyzeLeadData } from '../services/aiLeadService.js';
import { buildOfferSnapshot, resolveConfiguredOffer } from '../services/hotelOfferService.js';

const findLeadByIdentifier = async (leadId) => {
  if (!leadId) return null;

  return Lead.findOne({
    $or: [
      ...(String(leadId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: leadId }] : []),
      { LeadID: leadId },
      { LeadNo: leadId },
    ],
  });
};

const buildInputDetails = (body) => ({
  eventPurpose: body.eventPurpose || null,
  guestCount: body.guestCount ? Number(body.guestCount) : null,
  roomsCount: body.roomsCount ? Number(body.roomsCount) : null,
  startDate: body.startDate || null,
  endDate: body.endDate || null,
  budgetRange: body.budgetRange || null,
  preferredLocation: body.preferredLocation || null,
  decisionTimeline: body.decisionTimeline || null,
  contactMethod: body.contactMethod || null,
});

const buildLeadPayload = async (body, analysis) => {
  const hotelOfferId = body.selectedHotelOfferId || body.SelectedHotelOfferID || body.hotelOfferId || null;
  const hotelName = body.selectedHotelName || body.SelectedHotelName || body.hotelName || null;
  const hotelCode = body.selectedHotelCode || body.SelectedHotelCode || body.hotelCode || null;
  const configuredOffer = await resolveConfiguredOffer({
    hotelOfferId,
    hotelName,
    hotelCode,
    segment: analysis.segment,
    mode: 'initial',
  });

  return {
    ...body,
    Lead_Source_Term: body.Lead_Source_Term || body.eventPurpose || 'Manual Entry',
    Address: body.Address || body.preferredLocation || null,
    Priority: body.Priority || body.mainPriority || body.decisionTimeline || null,
    IsGroup: body.IsGroup ?? Boolean(body.groupType),
    Status: body.Status || body.status || 'Pending',
    LeadRatings: analysis.score,
    AISegment: analysis.segment,
    AIRecommendation: analysis.recommendedAction,
    AIRecommendations: analysis.recommendedActions,
    AIScoreBreakdown: analysis.breakdown,
    AISignals: analysis.signals,
    AIRisks: analysis.risks,
    AIScoreUpdatedOn: new Date(),
    Lead_Status_Term: body.Lead_Status_Term || 'Scored',
    Comment: body.Comment || body.specialRequirements || analysis.recommendedAction,
    SelectedHotelOfferID: configuredOffer.hotelOffer?.HotelOfferID || hotelOfferId,
    SelectedHotelName: configuredOffer.hotelOffer?.HotelName || hotelName,
    SelectedHotelCode: configuredOffer.hotelOffer?.HotelCode || hotelCode,
    PropertyID: configuredOffer.hotelOffer?.HotelCode || hotelCode,
    AppliedOffer: buildOfferSnapshot({
      ...configuredOffer,
      segment: analysis.segment,
      mode: 'initial',
    }),
    LastActivityDate: new Date(),
    InputDetails: buildInputDetails(body),
  };
};

const buildLeadActivity = (lead, action) => {
  const name = lead.CompanyName || [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || 'Lead';
  const subject = `${name}${lead.LeadNo ? ` (${lead.LeadNo})` : ''}`;
  return {
    ClientID: lead.ClientID || null,
    OwnerID: lead.OwnerID || null,
    AssociationID: lead.LeadID || null,
    AssociationType_Term: 'Lead',
    ActivityStatus_Term: lead.Status || 'Pending',
    ActivityType_Term: action === 'create' ? 'Lead Created' : 'Lead Updated',
    Priority_Term: lead.Priority || null,
    ActivitySubject: `${subject} ${action === 'create' ? 'created' : 'updated'}`,
    ActivityDetails: lead.Comment
      ? `${lead.Comment}${lead.LeadRatings ? ` | Score: ${lead.LeadRatings}` : ''}`
      : `${action === 'create' ? 'Lead created' : 'Lead updated'}${lead.Status ? ` with status ${lead.Status}` : ''}`,
    DateOfCreated: new Date(),
    AccountID: lead.AccountID || null,
    SeqNo: lead.SeqNo || 0,
    UpdateOn: new Date(),
    UpdateBy: lead.OwnerID || null,
    IsActive: lead.IsActive ?? true,
    EmailSendTo: lead.Email || null,
    AccountName: lead.CompanyName || [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || null,
    StartDate: lead.InputDetails?.startDate || null,
    EndDate: lead.InputDetails?.endDate || null,
  };
};

export const createLead = async (req, res, next) => {
  try {
    const analysis = await analyzeLeadData(req.body, []);
    const lead = await Lead.create(await buildLeadPayload(req.body, analysis));
    await Activity.create(buildLeadActivity(lead, 'create'));

    res.status(201).json({ lead, analysis });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await findLeadByIdentifier(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await findLeadByIdentifier(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    const mergedLead = {
      ...lead.toObject(),
      ...req.body,
      InputDetails: {
        ...(lead.InputDetails?.toObject?.() || lead.InputDetails || {}),
        ...buildInputDetails(req.body),
      },
    };

    const activities = await Activity.find({ AssociationID: lead.LeadID || lead._id }).sort({ DateOfCreated: -1 });
    const analysis = await analyzeLeadData(mergedLead, activities);
    const payload = await buildLeadPayload(mergedLead, analysis);

    Object.assign(lead, payload, {
      LeadRatings: analysis.score,
      AISegment: analysis.segment,
      AIRecommendation: analysis.recommendedAction,
      AIRecommendations: analysis.recommendedActions,
      AIScoreBreakdown: analysis.breakdown,
      AISignals: analysis.signals,
      AIRisks: analysis.risks,
      AIScoreUpdatedOn: new Date(),
      Status: payload.Status || lead.Status || 'Pending',
      Lead_Status_Term: payload.Lead_Status_Term || lead.Lead_Status_Term || 'Scored',
      LastActivityDate: new Date(),
    });

    await lead.save();
    await Activity.create(buildLeadActivity(lead, 'update'));
    res.json({ lead, analysis });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const totalLeads = await Lead.countDocuments();
    const leads = await Lead.find()
      .sort({ CreatedOn: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      leads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLeads / limit),
        totalLeads,
        hasNextPage: page * limit < totalLeads,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeLead = async (req, res, next) => {
  try {
    const leadId = req.body?.leadData?.id || req.body?.id;
    const lead = await findLeadByIdentifier(leadId);
    
    const activities = lead 
      ? await Activity.find({ AssociationID: lead.LeadID || lead._id }).sort({ DateOfCreated: -1 })
      : [];
      
    const analysis = await analyzeLeadData(lead || req.body?.leadData || {}, activities);

    if (lead) {
      lead.LeadRatings = analysis.score;
      lead.AISegment = analysis.segment;
      lead.AIRecommendation = analysis.recommendedAction;
      lead.AIRecommendations = analysis.recommendedActions;
      lead.AIScoreBreakdown = analysis.breakdown;
      lead.AISignals = analysis.signals;
      lead.AIRisks = analysis.risks;
      lead.AIScoreUpdatedOn = new Date();
      lead.Lead_Status_Term = lead.Lead_Status_Term || 'Scored';
      lead.Status = lead.Status || 'Pending';
      lead.Comment = lead.Comment || analysis.recommendedAction;
      lead.LastActivityDate = new Date();
      await lead.save();
    }

    res.json({
      score: analysis.score,
      next_best_action: analysis.recommendedAction,
      next_best_actions: analysis.recommendedActions,
      segment: analysis.segment,
      breakdown: analysis.breakdown,
      signals: analysis.signals,
      risks: analysis.risks,
      summary: analysis.summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadInsights = async (req, res, next) => {
  try {
    const lead = await findLeadByIdentifier(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    const activities = await Activity.find({ AssociationID: lead.LeadID || lead._id }).sort({ DateOfCreated: -1 });
    const analysis = await analyzeLeadData(lead, activities);
    res.json({ lead, analysis });
  } catch (error) {
    next(error);
  }
};
