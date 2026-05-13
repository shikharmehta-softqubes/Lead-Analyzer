import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';

export const getActivities = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.leadId) {
       const lead = await Lead.findOne({
          $or: [
            ...(String(req.query.leadId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.query.leadId }] : []),
            { LeadID: req.query.leadId },
            { LeadNo: req.query.leadId },
          ],
       });
       if(lead){
         filter.AssociationID = lead.LeadID;
       } else {
         filter.AssociationID = req.query.leadId;
       }
    }
    let activities = await Activity.find(filter).sort({ DateOfCreated: -1 }).limit(100);
    
    // Fallback: Populate AccountName for activities that don't have it but have an AssociationID
    const leadIdsToFetch = activities
      .filter(a => !a.AccountName && a.AssociationID && a.AssociationType_Term === 'Lead')
      .map(a => a.AssociationID);
      
    if (leadIdsToFetch.length > 0) {
      const leads = await Lead.find({ LeadID: { $in: leadIdsToFetch } }).select('LeadID CompanyName FirstName LastName');
      const leadMap = leads.reduce((acc, lead) => {
        acc[lead.LeadID] = lead.CompanyName || [lead.FirstName, lead.LastName].filter(Boolean).join(' ');
        return acc;
      }, {});
      
      activities = activities.map(a => {
        const doc = a.toObject();
        if (!doc.AccountName && doc.AssociationID && leadMap[doc.AssociationID]) {
          doc.AccountName = leadMap[doc.AssociationID];
        }
        return doc;
      });
    }

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const { 
        ActivitySubject, 
        ActivityDetails, 
        ActivityType_Term, 
        ActivityStatus_Term,
        AssociationID
    } = req.body;

    let leadAssociationID = AssociationID;
    let accountName = null;
    if(AssociationID){
       const lead = await Lead.findOne({
          $or: [
            ...(String(AssociationID).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: AssociationID }] : []),
            { LeadID: AssociationID },
            { LeadNo: AssociationID },
          ],
       });
       if(lead){
         leadAssociationID = lead.LeadID;
         accountName = lead.CompanyName || [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || null;
       }
    }

    const newActivity = await Activity.create({
      ActivitySubject: ActivitySubject || 'New Activity',
      ActivityDetails: ActivityDetails || '',
      ActivityType_Term: ActivityType_Term || 'General',
      ActivityStatus_Term: ActivityStatus_Term || 'Completed',
      AssociationID: leadAssociationID || null,
      AssociationType_Term: leadAssociationID ? 'Lead' : 'Communication',
      AccountName: accountName,
      DateOfCreated: new Date(),
    });

    res.status(201).json({
      ...newActivity.toObject(),
      AccountName: accountName // Ensure it's returned immediately
    });
  } catch (error) {
    next(error);
  }
};
