import express from 'express';
import { deleteHotelOffer, getHotelOfferById, getHotelOffers, saveHotelOffer } from '../controllers/hotelOfferController.js';

const router = express.Router();

router.route('/')
  .get(getHotelOffers)
  .post(saveHotelOffer);

router.route('/:id')
  .get(getHotelOfferById)
  .put(saveHotelOffer)
  .delete(deleteHotelOffer);

export default router;
