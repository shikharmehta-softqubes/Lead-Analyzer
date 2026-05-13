import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { buildFollowUpEmailDraft } from './aiLeadService.js';
import { buildOfferSnapshot, resolveConfiguredOffer } from './hotelOfferService.js';

const MAX_FOLLOWUPS = 3;
const FOLLOW_UP_DELAY_MS = 48 * 60 * 60 * 1000; // 48 hours
const DEFAULT_SCAN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const getLatestActivityTime = (activities) => {
  if (!activities.length) return null;
  return new Date(Math.max(...activities.map((activity) => new Date(activity.DateOfCreated).getTime())));
};

const countFollowUpEmails = (activities) => activities
  .filter((activity) => activity.ActivityType_Term === 'Follow-up Email')
  .length;

const buildActivitiesSummary = (activities) => {
  if (!activities.length) return 'No previous activity details are available.';

  const recent = activities.slice(0, 5).map((activity) => {
    const when = activity.DateOfCreated ? new Date(activity.DateOfCreated).toLocaleDateString() : 'Unknown date';
    const subject = activity.ActivitySubject || activity.ActivityType_Term || 'Activity';
    const details = activity.ActivityDetails || 'No details available.';
    return `On ${when}, ${subject}: ${details}`;
  });

  return recent.join(' ');
};

const shouldSendFollowUp = (lead, activities) => {
  if (!lead) return false;
  if (lead.Status === 'Closed') return false;
  if (!lead.Email) return false;

  const followUpCount = countFollowUpEmails(activities);
  if (followUpCount >= MAX_FOLLOWUPS) return false;

  const latestActivityTime = getLatestActivityTime(activities) || new Date(lead.CreatedOn || lead.CreatedOn);
  if (!latestActivityTime) return false;

  const elapsed = Date.now() - latestActivityTime.getTime();
  return elapsed >= FOLLOW_UP_DELAY_MS;
};

const createFollowUpActivity = async ({ lead, draft, followUpNumber }) => {
  return Activity.create({
    ClientID: lead.ClientID || null,
    OwnerID: lead.OwnerID || null,
    AssociationID: lead.LeadID || null,
    AssociationType_Term: 'Lead',
    ActivityStatus_Term: 'Sent',
    ActivityType_Term: 'Follow-up Email',
    Priority_Term: lead.Priority || null,
    ActivitySubject: `Follow-up email ${followUpNumber}`,
    ActivityDetails: draft,
    DateOfCreated: new Date(),
    AccountID: lead.AccountID || null,
    SeqNo: lead.SeqNo || 0,
    UpdateOn: new Date(),
    UpdateBy: lead.OwnerID || null,
    IsActive: true,
    EmailSendTo: lead.Email || null,
    AccountName: lead.CompanyName || null,
  });
};

export const processFollowUpForLead = async (lead) => {
  const activities = await Activity.find({ AssociationID: lead.LeadID }).sort({ DateOfCreated: -1 });
  if (!shouldSendFollowUp(lead, activities)) {
    return null;
  }

  const followUpCount = countFollowUpEmails(activities);
  const followUpNumber = followUpCount + 1;
  const activitySummary = buildActivitiesSummary(activities);
  const draft = await buildFollowUpEmailDraft({
    lead,
    activitySummary,
    followUpNumber,
    isAutoFollowUp: true,
  });

  const configuredOffer = await resolveConfiguredOffer({
    hotelOfferId: lead.SelectedHotelOfferID,
    hotelName: lead.SelectedHotelName,
    hotelCode: lead.SelectedHotelCode,
    segment: lead.AISegment,
    mode: 'auto-follow-up',
  });

  await createFollowUpActivity({ lead, draft, followUpNumber });

  lead.Status = 'Follow-up';
  lead.LastActivityDate = new Date();
  lead.AppliedOffer = buildOfferSnapshot({
    ...configuredOffer,
    segment: lead.AISegment,
    mode: 'auto-follow-up',
  }) || lead.AppliedOffer;
  await lead.save();

  return { leadId: lead.LeadID, draft, followUpNumber };
};

export const scanPendingLeadFollowUps = async () => {
  const leads = await Lead.find({ Status: { $ne: 'Closed' } });
  const results = [];

  for (const lead of leads) {
    try {
      const result = await processFollowUpForLead(lead);
      if (result) results.push(result);
    } catch (error) {
      console.error('Error processing follow-up for lead', lead.LeadID, error);
    }
  }

  return results;
};

export const schedulePendingLeadFollowUps = () => {
  const intervalMs = Number(process.env.FOLLOW_UP_SCAN_INTERVAL_MS) || DEFAULT_SCAN_INTERVAL_MS;

  const runScan = async () => {
    try {
      const results = await scanPendingLeadFollowUps();
      if (results.length) {
        console.log(`Follow-up scan generated ${results.length} email(s).`);
      }
    } catch (error) {
      console.error('Follow-up scan failed:', error);
    }
  };

  runScan();
  setInterval(runScan, intervalMs);
};
