import express from 'express';
import { analyzeLead, createLead, getLeadById, getLeadInsights, getLeads, updateLead } from '../controllers/leadController.js';
import { scanPendingLeadFollowUps } from '../services/followUpService.js';

const router = express.Router();

router.route('/')
  .get(getLeads)
  .post(createLead);

router.post('/analyze', analyzeLead);
router.post('/followups/run', async (_req, res, next) => {
  try {
    const results = await scanPendingLeadFollowUps();
    res.json({ results });
  } catch (error) {
    next(error);
  }
});
router.get('/:id/insights', getLeadInsights);
router.route('/:id')
  .get(getLeadById)
  .put(updateLead);

export default router;
