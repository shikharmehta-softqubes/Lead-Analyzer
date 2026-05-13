import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { analyzeLeadData, buildPersonalizedEmailDraft, synthesizeLeadContext } from '../services/aiLeadService.js';
import { sendEmail } from '../services/emailService.js';
import { buildOfferSnapshot, resolveConfiguredOffer } from '../services/hotelOfferService.js';

const findLead = async (leadId) => {
  if (!leadId) return null;

  return Lead.findOne({
    $or: [
      ...(String(leadId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: leadId }] : []),
      { LeadID: leadId },
      { LeadNo: leadId },
    ],
  });
};

export const generateSmartReply = async (req, res, next) => {
  try {
    const emailContext = req.body?.emailContext || 'your inquiry';
    const lead = await findLead(req.body?.leadId);
    const analysis = analyzeLeadData(lead || req.body?.leadData || { Comment: emailContext });
    const draft = await buildPersonalizedEmailDraft({
      lead: lead || req.body?.leadData || {},
      emailContext,
      recommendedAction: analysis.recommendedAction,
      customOffer: req.body?.customOffer,
    });

    const actualLead = lead || req.body?.leadData || null;
    const accountName = actualLead ? (actualLead.CompanyName || [actualLead.FirstName, actualLead.LastName].filter(Boolean).join(' ') || null) : null;
    const subject = actualLead ? `AI smart reply generated for ${accountName || 'Unknown Lead'}` : 'AI smart reply generated';

    await Activity.create({
      ActivityDetails: `AI drafted response to: ${emailContext}`,
      ActivityType_Term: 'action',
      ActivityStatus_Term: 'Completed',
      ActivitySubject: subject,
      AssociationID: actualLead?.LeadID || actualLead?._id || null,
      AssociationType_Term: actualLead ? 'Lead' : 'Communication',
      AccountName: accountName,
      DateOfCreated: new Date(),
    });

    const offer = await resolveConfiguredOffer({
      hotelOfferId: actualLead?.SelectedHotelOfferID || actualLead?.selectedHotelOfferId,
      hotelName: actualLead?.SelectedHotelName || actualLead?.selectedHotelName,
      hotelCode: actualLead?.SelectedHotelCode || actualLead?.selectedHotelCode,
      segment: analysis.segment,
      mode: 'initial',
      customOffer: req.body?.customOffer,
    });

    if (lead && offer.offerText) {
      lead.AppliedOffer = buildOfferSnapshot({ ...offer, segment: analysis.segment, mode: 'initial' });
      await lead.save();
    }

    res.json({
      draft,
      appliedOffer: buildOfferSnapshot({ ...offer, segment: analysis.segment, mode: 'initial' }),
      response_preview: draft.split('\n').filter(Boolean).slice(0, 3).join(' '),
      follow_up_suggestion: analysis.recommendedAction,
      lead_analysis: analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFollowUp = async (req, res, next) => {
  try {
    const lead = await findLead(req.body?.leadId);
    if (!lead && !req.body?.leadData) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const actualLead = lead || req.body?.leadData;
    const activities = await Activity.find({ 
      AssociationID: actualLead.LeadID || actualLead._id 
    }).sort({ DateOfCreated: -1 });

    const followUpCount = activities.filter(a => a.ActivityType_Term === 'Follow-up Email').length;
    
    // Synthesize activity history into a concise summary to save tokens
    const interactionSummary = await synthesizeLeadContext(activities);

    const { buildFollowUpEmailDraft } = await import('../services/aiLeadService.js');
    const draft = await buildFollowUpEmailDraft({
      lead: actualLead,
      activitySummary: interactionSummary,
      followUpNumber: followUpCount + 1,
      customOffer: req.body?.customOffer,
    });

    const offer = await resolveConfiguredOffer({
      hotelOfferId: actualLead?.SelectedHotelOfferID || actualLead?.selectedHotelOfferId,
      hotelName: actualLead?.SelectedHotelName || actualLead?.selectedHotelName,
      hotelCode: actualLead?.SelectedHotelCode || actualLead?.selectedHotelCode,
      segment: actualLead?.AISegment,
      mode: 'follow-up',
      customOffer: req.body?.customOffer,
    });

    if (lead && offer.offerText) {
      lead.AppliedOffer = buildOfferSnapshot({
        ...offer,
        segment: actualLead?.AISegment,
        mode: 'follow-up',
      });
      await lead.save();
    }

    res.json({
      draft,
      appliedOffer: buildOfferSnapshot({
        ...offer,
        segment: actualLead?.AISegment,
        mode: 'follow-up',
      }),
      followUpNumber: followUpCount + 1,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSmartSMS = async (req, res, next) => {
  try {
    const lead = await findLead(req.body?.leadId);
    if (!lead && !req.body?.leadData) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const actualLead = lead || req.body?.leadData;
    const { buildSmartSMSDraft } = await import('../services/aiLeadService.js');
    const sms = await buildSmartSMSDraft({ lead: actualLead });

    res.json({ sms });
  } catch (error) {
    next(error);
  }
};

export const sendLeadEmail = async (req, res, next) => {
  try {
    const { leadId, content, subject } = req.body;
    const lead = await findLead(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const leadEmail = lead.Email || lead.EmailAddress;
    if (!leadEmail) {
      return res.status(400).json({ message: 'Lead does not have an email address' });
    }

    const emailSubject = subject || `Re: Inquiry - ${lead.CompanyName || 'Event Planning'}`;

    // Send actual email using nodemailer
    await sendEmail({
      to: leadEmail,
      subject: emailSubject,
      text: content,
    });

    await Activity.create({
      ActivityDetails: content.substring(0, 1000), // Truncate if too long
      ActivityType_Term: 'Email Sent',
      ActivityStatus_Term: 'Completed',
      ActivitySubject: emailSubject,
      AssociationID: lead.LeadID || lead._id,
      AssociationType_Term: 'Lead',
      AccountName: lead.CompanyName || `${lead.FirstName} ${lead.LastName}`,
      DateOfCreated: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
