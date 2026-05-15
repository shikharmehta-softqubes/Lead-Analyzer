import { generateEmailWithAI } from './aiEmailService.js';
import { resolveConfiguredOffer } from './hotelOfferService.js';

const getLeadValue = (lead, pascalKey, camelKey) => lead?.[pascalKey] ?? lead?.[camelKey] ?? null;

const getInputValue = (lead, key) => lead?.InputDetails?.[key] ?? lead?.[key] ?? null;

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const addScore = (breakdown, key, value) => {
  breakdown[key].score += value;
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

export const analyzeLeadData = async (lead = {}, activities = []) => {
  // 100-point deterministic model: contact 20, company 15, event 20,
  // budget 20, urgency 15, engagement 10.
  const breakdown = {
    contactCompleteness: { label: 'Contact Completeness', score: 0, max: 20 },
    companyFit: { label: 'Company / Account Fit', score: 0, max: 15 },
    eventRequirement: { label: 'Event Requirement Quality', score: 0, max: 20 },
    budgetStrength: { label: 'Budget Strength', score: 0, max: 20 },
    decisionUrgency: { label: 'Decision Urgency', score: 0, max: 15 },
    engagementReadiness: { label: 'Engagement Readiness', score: 0, max: 10 },
  };
  const signals = [];
  const risks = [];

  const companyName = getLeadValue(lead, 'CompanyName', 'companyName');
  const firstName = getLeadValue(lead, 'FirstName', 'firstName');
  const lastName = getLeadValue(lead, 'LastName', 'lastName');
  const email = getLeadValue(lead, 'Email', 'email');
  const mobileNo = getLeadValue(lead, 'MobileNo', 'mobileNumber');
  const telephoneNo = getLeadValue(lead, 'TelephoneNo', 'telephoneNo');
  const groupType = getLeadValue(lead, 'GroupType', 'groupType');
  const priority = getLeadValue(lead, 'Priority', 'mainPriority');
  const comment = getLeadValue(lead, 'Comment', 'specialRequirements');
  const leadSource = getLeadValue(lead, 'Lead_Source_Term', 'eventPurpose');
  const status = getLeadValue(lead, 'Status', 'status');
  const city = getLeadValue(lead, 'City', 'city');
  const country = getLeadValue(lead, 'Country', 'country');
  const preferredLocation = getInputValue(lead, 'preferredLocation');
  const guestCount = Number(getInputValue(lead, 'guestCount') || 0);
  const roomsCount = Number(getInputValue(lead, 'roomsCount') || 0);
  const startDate = getInputValue(lead, 'startDate');
  const endDate = getInputValue(lead, 'endDate');
  const budgetRange = getInputValue(lead, 'budgetRange');
  const decisionTimeline = getInputValue(lead, 'decisionTimeline');
  const contactMethod = getInputValue(lead, 'contactMethod');

  if (hasText(firstName)) addScore(breakdown, 'contactCompleteness', 3);
  if (hasText(lastName)) addScore(breakdown, 'contactCompleteness', 2);
  if (hasText(email)) addScore(breakdown, 'contactCompleteness', 7);
  if (hasText(mobileNo)) addScore(breakdown, 'contactCompleteness', 5);
  if (hasText(telephoneNo)) addScore(breakdown, 'contactCompleteness', 2);
  if (hasText(contactMethod)) addScore(breakdown, 'contactCompleteness', 1);

  if (hasText(email)) signals.push('Email channel available');
  if (hasText(mobileNo)) signals.push('Direct mobile follow-up available');
  if (!hasText(email)) risks.push('Email address is missing');
  if (!hasText(mobileNo) && !hasText(telephoneNo)) risks.push('No phone number available');

  if (hasText(companyName)) {
    addScore(breakdown, 'companyFit', 7);
    signals.push('Company account identified');
  } else {
    risks.push('Company name is missing');
  }
  if (hasText(leadSource)) addScore(breakdown, 'companyFit', 3);
  if (hasText(city) || hasText(country) || hasText(preferredLocation)) addScore(breakdown, 'companyFit', 3);
  if (status === 'Follow-up') addScore(breakdown, 'companyFit', 2);
  if (status === 'Closed') risks.push('Lead is already closed');

  if (hasText(groupType)) {
    addScore(breakdown, 'eventRequirement', 4);
    signals.push(`Group type captured: ${groupType}`);
  }
  if (guestCount > 0) addScore(breakdown, 'eventRequirement', 4);
  if (guestCount >= 100) addScore(breakdown, 'eventRequirement', 3);
  if (roomsCount > 0) addScore(breakdown, 'eventRequirement', 4);
  if (hasText(startDate)) addScore(breakdown, 'eventRequirement', 2);
  if (hasText(endDate)) addScore(breakdown, 'eventRequirement', 1);
  if (hasText(comment)) {
    addScore(breakdown, 'eventRequirement', 2);
    signals.push('Requirement notes available for personalization');
  }
  if (!hasText(groupType)) risks.push('Group type is missing');
  if (!guestCount) risks.push('Guest count is missing');
  if (!roomsCount) risks.push('Room count is missing');

  if (budgetRange === 'over_100k') {
    addScore(breakdown, 'budgetStrength', 20);
    signals.push('Very strong budget range');
  } else if (budgetRange === '50k_to_100k') {
    addScore(breakdown, 'budgetStrength', 15);
    signals.push('Strong budget range');
  } else if (budgetRange === '10k_to_50k') {
    addScore(breakdown, 'budgetStrength', 9);
  } else if (budgetRange === 'under_10k') {
    addScore(breakdown, 'budgetStrength', 4);
    risks.push('Budget may be low for high-value conversion');
  } else {
    risks.push('Budget range is missing');
  }

  if (decisionTimeline === 'ASAP') {
    addScore(breakdown, 'decisionUrgency', 15);
    signals.push('Urgent buying timeline');
  } else if (decisionTimeline === 'Week') {
    addScore(breakdown, 'decisionUrgency', 11);
  } else if (decisionTimeline === 'Month') {
    addScore(breakdown, 'decisionUrgency', 7);
  } else {
    risks.push('Decision timeline is missing');
  }

  if (priority === 'High') {
    addScore(breakdown, 'engagementReadiness', 5);
    signals.push('Marked as high priority');
  } else if (priority === 'Medium') {
    addScore(breakdown, 'engagementReadiness', 3);
  } else if (priority === 'Low') {
    addScore(breakdown, 'engagementReadiness', 1);
  }
  if (status === 'Follow-up') addScore(breakdown, 'engagementReadiness', 3);
  if (hasText(comment)) addScore(breakdown, 'engagementReadiness', 2);

  Object.values(breakdown).forEach((item) => {
    item.score = Math.min(item.score, item.max);
  });

  const leadScore = clampScore(Object.values(breakdown).reduce((total, item) => total + item.score, 0));
  const segment = getSegment(leadScore);
  const recommendedActions = await getRecommendedActions(leadScore, {
    decisionTimeline,
    priority,
    email,
    mobileNo,
    status,
    companyName,
    firstName,
    groupType,
    comment
  }, activities);

  return {
    score: leadScore,
    segment,
    breakdown,
    signals,
    risks,
    recommendedAction: recommendedActions[0] || 'Review lead',
    recommendedActions,
    summary: buildLeadSummary({ companyName, firstName, groupType, comment, segment }),
  };
};

const getSegment = (score) => {
  if (score >= 82) return 'Hot';
  if (score >= 65) return 'Warm';
  return 'Cold';
};

export const generateAIRecommendedAction = async (leadData, activities = []) => {
  const history = activities.length > 0 
    ? activities.slice(0, 5).map(a => `- ${a.ActivityType_Term}: ${a.ActivitySubject} | ${a.ActivityDetails}`).join('\n')
    : 'No interaction history yet.';

  const prompt = `You are an expert sales operations AI. Based on the lead details and recent interaction history, suggest the SINGLE most important Next Best Action for this lead.
  
  Lead: ${leadData.firstName || 'Contact'} from ${leadData.companyName || 'Unknown Company'}
  Inquiry: ${leadData.groupType || 'General inquiry'}
  Notes: ${leadData.comment || 'None'}
  Status: ${leadData.status}
  
  Recent Activity History:
  ${history}
  
  Your suggestion should be highly specific (max 15 words). Example: "Follow up on Sarah's question about the ballroom dates" or "Send the requested seasonal pricing menu".
  
  Next Best Action:`;

  const action = await generateEmailWithAI(prompt, 'gpt-4o-mini');
  return action?.replace(/^"|"$/g, '') || null;
};

export const getRecommendedActions = async (score, lead = {}, activities = []) => {
  if (lead.status === 'Closed') return ['No sales action required unless the lead reopens.'];
  
  const actions = [];
  
  // Try AI first for the primary action
  if (activities.length > 0 || lead.comment) {
    const aiAction = await generateAIRecommendedAction(lead, activities);
    if (aiAction) actions.push(aiAction);
  }

  // Rule 1: High Priority / ASAP
  if (lead.decisionTimeline === 'ASAP' || lead.priority === 'High') {
    actions.push('Prioritize a qualification call and confirm decision criteria.');
  }

  // Rule 2: High Score
  if (score >= 85) {
    actions.push('Schedule an executive sales call and send a tailored proposal today.');
  }

  // Rule 3: Qualified / Follow-up
  if (score >= 65 && score < 85) {
    actions.push('Send a personalized proposal and follow up within 24 hours.');
  }

  // Rule 4: Communication Channels
  if (lead.email) {
    actions.push('Send a helpful nurture email with relevant case studies and pricing options.');
  }
  
  if (lead.mobileNo) {
    actions.push('Call the lead to complete missing qualification details.');
  }

  // Fallback
  if (actions.length === 0) {
    actions.push('Collect missing contact details before starting an automated follow-up sequence.');
  }
  
  // Return unique actions, max 3 for UI stability
  return [...new Set(actions)].slice(0, 3);
};

// Keeping for backward compatibility if needed internally, but using plural version now
export const getRecommendedAction = async (score, lead = {}) => (await getRecommendedActions(score, lead))[0];

export const buildLeadSummary = ({ companyName, firstName, groupType, comment, segment }) => {
  const contact = firstName || 'The lead';
  const account = companyName ? ` from ${companyName}` : '';
  const group = groupType ? ` for a ${groupType} requirement` : '';
  const details = comment ? ` Notes indicate: ${comment}` : '';

  return `${contact}${account}${group} is currently classified as ${segment}.${details}`;
};

const buildPersonalizedEmailFallback = ({ lead = {}, emailContext = '', recommendedAction = '', offer = '' }) => {
  const firstName = getLeadValue(lead, 'FirstName', 'firstName') || 'there';
  const companyName = getLeadValue(lead, 'CompanyName', 'companyName') || 'your team';
  const groupType = getLeadValue(lead, 'GroupType', 'groupType');
  const comment = getLeadValue(lead, 'Comment', 'specialRequirements');
  const context = emailContext || groupType || 'your recent inquiry';

  return [
    `Hi ${firstName},`,
    '',
    `Thank you for reaching out about ${context}. Based on what you shared, ${companyName} may be a strong fit for a tailored proposal and next-step discussion.`,
    '',
    comment ? `I noted your key requirement: ${comment}` : 'I can help confirm availability, pricing, and the best package for your requirements.',
    offer ? `For this inquiry, we can include: ${offer}` : '',
    '',
    recommendedAction || 'Would you be available for a short call so we can confirm priorities and prepare the right proposal?',
    '',
    'Best,',
    'Alex Jensen',
  ].join('\n');
};

const getHotelOfferContext = async ({ lead, segment, mode, followUpNumber = 0, customOffer }) => {
  const configuredOffer = await resolveConfiguredOffer({
    hotelOfferId: getLeadValue(lead, 'SelectedHotelOfferID', 'selectedHotelOfferId'),
    hotelName: getLeadValue(lead, 'SelectedHotelName', 'selectedHotelName'),
    hotelCode: getLeadValue(lead, 'SelectedHotelCode', 'selectedHotelCode'),
    segment,
    mode,
    customOffer,
  });

  return configuredOffer.offerText || getDynamicOffer(Number(getLeadValue(lead, 'LeadRatings', 'score') || 0), segment, followUpNumber);
};

/**
 * Synthesizes raw lead activities into a concise interaction summary to save tokens.
 */
export const synthesizeLeadContext = async (activities = []) => {
  if (!activities || activities.length === 0) return 'No previous interactions recorded.';

  // Filter and format activities to be more concise before sending to LLM
  const activityLog = activities
    .slice(0, 10) // Take a bit more but keep it reasonable
    .map(a => `- ${a.ActivityType_Term} (${new Date(a.DateOfCreated).toLocaleDateString()}): ${a.ActivityDetails.substring(0, 150)}`)
    .join('\n');

  const prompt = `You are a sales operations analyst. Synthesize the following lead interaction history into a single, highly concise paragraph (max 50 words). 
  Focus ONLY on the current engagement status and the most recent meaningful discussion point.
  
  Interaction History:
  ${activityLog}
  
  Concise Synthesis:`;

  const synthesis = await generateEmailWithAI(prompt, 'gpt-4o-mini');
  return synthesis || 'Multiple interactions recorded with no clear summary.';
};

export const buildPersonalizedEmailDraft = async ({ lead = {}, emailContext = '', recommendedAction = '', customOffer = '' }) => {
  const firstName = getLeadValue(lead, 'FirstName', 'firstName') || 'Contact';
  const companyName = getLeadValue(lead, 'CompanyName', 'companyName') || 'the client';
  const groupType = getLeadValue(lead, 'GroupType', 'groupType') || 'event';
  const comment = getLeadValue(lead, 'Comment', 'specialRequirements');
  const guestCount = getInputValue(lead, 'guestCount');
  const budgetRange = getInputValue(lead, 'budgetRange');
  const startDate = getInputValue(lead, 'startDate');
  const endDate = getInputValue(lead, 'endDate');

  // For the first email, we use a consistent "Initial Outreach" goal regardless of segment
  // unless a very specific action is provided.
  const goal = emailContext.toLowerCase().includes('initial') 
    ? 'Establish a connection, confirm their event requirements, and offer a preliminary consultation.'
    : (recommendedAction || 'Confirm details and propose next steps.');

  const score = Number(getLeadValue(lead, 'LeadRatings', 'score') || 0);
  const segment = lead.AISegment || getSegment(score);
  const strategy = getFollowUpStrategy(segment);
  const offer = await getHotelOfferContext({ lead, segment, mode: 'initial', customOffer });

  const prompt = `You are an expert sales strategist. Write the FIRST outreach email for a ${strategy.label} lead (Score: ${score}%).
  
  FORMAT & VIBE (STRICT):
  - Segment: ${strategy.label}
  - Tone: ${strategy.vibe}
  - Pattern: ${strategy.pattern}
  
  OFFER TO INCLUDE:
  - ${offer}
  
  CRITICAL INSTRUCTIONS:
  1. DO NOT use a subject line.
  2. Start with: "I hope this message finds you well."
  3. If "OFFER TO INCLUDE" is not "null", weave it naturally into the text as a special benefit for them. If it IS "null", do not mention any offer.
  4. Use lead details (Guests: ${guestCount || 'N/A'}, Budget: ${budgetRange || 'N/A'}) naturally.
  5. Include the standard signature block at the end.
  6. Keep it under 180 words.
 
  Context:
  - Lead: ${firstName} (${companyName})
  - Inquiry: ${groupType}
  - Notes: ${comment || 'None'}
 
  Write the initial outreach email now:`;

  const aiDraft = await generateEmailWithAI(prompt, 'gpt-4o-mini');
  return aiDraft || buildPersonalizedEmailFallback({ lead, emailContext, recommendedAction: goal, offer });
};

const getDynamicOffer = (score, segment, followUpNumber = 0) => {
  // Strategy: 
  // - High Value gets premium offers early to 'wow' them.
  // - Others get offers only in later follow-ups (incentive to reply).
  
  if (score >= 85) {
    // High Value: Offer something premium immediately or in early follow-ups
    return 'COMPLIMENTARY UPGRADE: Offer a free VIP Lounge upgrade or a dedicated on-site event concierge.';
  } 
  
  if (score >= 65) {
    // Qualified: Offer a bundle starting from Follow-up #1
    if (followUpNumber >= 1) {
      return 'BUNDLE VALUE: Offer complimentary high-speed Wi-Fi and premium AV equipment setup.';
    }
    return null; // No offer in initial outreach
  }
  
  if (score >= 45) {
    // Nurture: Offer incentive only if they are silent (Follow-up #2+)
    if (followUpNumber >= 2) {
      return 'SPECIAL INCENTIVE: Offer a 5% discount on the total package if booked within the next 7 days.';
    }
    return null; // No offer early on
  } 
  
  // At Risk / Low Priority: Only offer a 'Recovery' discount at the very end
  if (followUpNumber >= 3) {
    return 'RECOVERY OFFER: Offer a 10% first-time client discount to secure the booking.';
  }
  
  return null; // Most emails for low-priority leads won't have an offer
};

const getFollowUpStrategy = (segment) => {
  switch (segment) {
    case 'Hot':
      return {
        label: 'High Value (Hot)',
        vibe: 'Direct, Executive, and Exclusive. Focus on high-touch service and priority scheduling.',
        pattern: '1. Professional Greeting. 2. Acknowledge VIP status/inquiry. 3. Express enthusiasm for collaboration. 4. Direct Call-to-Action for a consultation.',
      };
    case 'Warm':
      return {
        label: 'Nurture (Warm)',
        vibe: 'Warm, Helpful, and Relationship-focused. Be a consultant, not a salesperson.',
        pattern: '1. Warm Greeting. 2. Reference the ongoing relationship. 3. Offer value (case studies or tips). 4. Soft Call-to-Action for an open discussion.',
      };
    case 'Cold':
    default:
      return {
        label: 'At Risk (Cold)',
        vibe: 'Casual, Minimalist, and Information-gathering.',
        pattern: '1. Quick Greeting. 2. Acknowledge the missing details (Guest Count/Budget). 3. Offer educational resources. 4. Low-pressure request for information.',
      };
  }
};

export const buildFollowUpEmailDraft = async ({
  lead = {},
  activitySummary = '',
  followUpNumber = 1,
  customOffer = '',
  isAutoFollowUp = false,
}) => {
  const firstName = getLeadValue(lead, 'FirstName', 'firstName') || 'Contact';
  const companyName = getLeadValue(lead, 'CompanyName', 'companyName') || 'the client';
  const groupType = getLeadValue(lead, 'GroupType', 'groupType') || 'event';
  const comment = getLeadValue(lead, 'Comment', 'specialRequirements');
  const score = Number(getLeadValue(lead, 'LeadRatings', 'score') || 0);
  const segment = lead.AISegment || getSegment(score);
  const guestCount = getInputValue(lead, 'guestCount');
  const budgetRange = getInputValue(lead, 'budgetRange');

  const urgencyLine = followUpNumber === 3
    ? 'This is our final follow-up to ensure we don\'t miss this opportunity.'
    : `Follow-up ${followUpNumber} of 3: Checking in to keep momentum on this inquiry.`;

  const strategy = getFollowUpStrategy(segment);
  const offer = await getHotelOfferContext({
    lead,
    segment,
    mode: isAutoFollowUp ? 'auto-follow-up' : 'follow-up',
    followUpNumber,
    customOffer,
  });

  const interactionSummary = typeof activitySummary === 'string' && activitySummary.length > 200
    ? await synthesizeLeadContext([{ ActivityType_Term: 'History', ActivityDetails: activitySummary, DateOfCreated: new Date() }])
    : activitySummary;

  const prompt = `You are an expert sales strategist. Write a dynamic FOLLOW-UP email for a ${strategy.label} lead (Score: ${score}%).
  
  VIBE (STRICT): ${strategy.vibe}
  
  OFFER TO INCLUDE:
  - ${offer}
  
  CRITICAL INSTRUCTIONS:
  1. DO NOT use a subject line.
  2. Start with: "I hope this message finds you well!" or similar.
  3. If "OFFER TO INCLUDE" is not "null", weave it naturally into the text. If it IS "null", do not mention any offer.
  4. Reference the "Recent Activity" to show continuity.
  5. If data is missing (Guests/Budget), ask for it politely.
  6. Include the standard signature block at the end.
  7. Keep it under 160 words.
 
  Dynamic Context:
  - Lead: ${firstName} (${companyName})
  - Requirement: ${groupType}
  - Follow-up: #${followUpNumber} | Status: ${urgencyLine}
  - Recent Activity Synthesis: ${interactionSummary || 'Initial outreach sent'}
 
  Write the follow-up email now:`;

  const aiDraft = await generateEmailWithAI(prompt, 'gpt-4o-mini');
  
  const fallbackDraft = [
    `Hi ${firstName},`,
    '',
    `I'm following up regarding your ${groupType} inquiry for ${companyName}.`,
    '',
    activitySummary ? `Here’s a quick recap of our recent activity: ${activitySummary}` : 'I wanted to check in and keep things moving on this request.',
    '',
    comment ? `I also wanted to confirm the requirement you shared: ${comment}.` : 'I\'m ready to help confirm your needs and next steps whenever you\'re available.',
    offer ? `We can also apply this offer: ${offer}` : '',
    '',
    urgencyLine,
    '',
    'If now is a better time to connect, I\'m happy to arrange a short call or share an updated proposal.',
    '',
    'Best,',
    'Alex Jensen',
  ].join('\n');

  return aiDraft || fallbackDraft;
};

export const buildSmartSMSDraft = async ({ lead = {} }) => {
  const firstName = getLeadValue(lead, 'FirstName', 'firstName') || 'there';
  const companyName = getLeadValue(lead, 'CompanyName', 'companyName') || 'your team';
  const groupType = getLeadValue(lead, 'GroupType', 'groupType') || 'event';
  const score = Number(getLeadValue(lead, 'LeadRatings', 'score') || 0);
  const segment = lead.AISegment || getSegment(score);

  let goal = '';
  if (segment === 'Hot') {
    goal = 'High Urgency. Direct invitation for a quick call or site visit. Premium feel.';
  } else if (segment === 'Warm') {
    goal = 'Relationship Building. Friendly check-in. Ask if they need any more information.';
  } else {
    goal = 'Gentle Ping. Casual reminder about the inquiry. Low pressure.';
  }

  const prompt = `Write a short, professional sales SMS for the lead below. 
  
  RULES:
  1. MAX 160 CHARACTERS.
  2. No subject line.
  3. Professional but conversational.
  4. Segment Goal: ${goal}
  
  Lead Info:
  - Name: ${firstName}
  - Company: ${companyName}
  - Inquiry: ${groupType}
  
  Write the SMS content now (under 160 chars):`;

  const draft = await generateEmailWithAI(prompt, 'gpt-4o-mini');
  
  // Fallback SMS
  const fallback = `Hi ${firstName}, checking in on your ${groupType} inquiry for ${companyName}. Would you have 5 mins for a quick call this week? - Alex, CRM Team`;
  
  return draft || fallback;
};
