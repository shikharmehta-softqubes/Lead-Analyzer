import express from 'express';
import { generateSmartReply, generateFollowUp, generateSmartSMS, sendLeadEmail } from '../controllers/communicationController.js';

const router = express.Router();

router.post('/smart-reply', generateSmartReply);
router.post('/generate-follow-up', generateFollowUp);
router.post('/generate-sms', generateSmartSMS);
router.post('/send-email', sendLeadEmail);

export default router;
