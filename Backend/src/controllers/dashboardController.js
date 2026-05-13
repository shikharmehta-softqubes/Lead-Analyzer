import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const closedLeads = await Lead.countDocuments({ Status: 'Closed' });
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    const aiActivities = await Activity.countDocuments({
      ActivityType_Term: { $in: ['action', 'Follow-up Email'] }
    });

    const timeSavedMins = aiActivities * 15;
    const timeSavedHrs = Math.round(timeSavedMins / 60);

    // Get chart data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartDataRaw = await Lead.aggregate([
      {
        $match: {
          CreatedOn: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$CreatedOn" } },
          count: { $sum: 1 },
          avgScore: { $avg: "$LeadRatings" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map to last 7 days to ensure all days have a value
    const aiChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = chartDataRaw.find(item => item._id === dateStr);
      aiChartData.push({
        date: dateStr,
        count: found ? found.count : 0,
        qualityScore: found ? Math.round(found.avgScore || 0) : 0
      });
    }

    const nextActions = await Lead.find({ Status: { $ne: 'Closed' } })
      .sort({ LeadRatings: -1 })
      .limit(3);

    res.json({
      stats: {
        totalLeads,
        conversionRate,
        aiAutomatedReplies: aiActivities,
        operationalTimeSaved: timeSavedHrs
      },
      aiPerformance: aiChartData,
      nextActions: nextActions.map(l => ({
        id: l._id || l.LeadID,
        company: l.CompanyName || 'Unknown',
        action: l.AIRecommendation || l.Comment || 'Review lead',
        time: l.LastActivityDate ? new Date(l.LastActivityDate).toLocaleDateString() : 'New',
        priority: l.Priority || 'Medium'
      }))
    });
  } catch (error) {
    next(error);
  }
};
