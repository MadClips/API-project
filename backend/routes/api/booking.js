const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const {
  User,
  Spot,
  Booking,
  Review,
  SpotImage,
  ReviewImage,
} = require(`../../db/models`);

const { check } = require(`express-validator`);
const { handleValidationErrors } = require(`../../utils/validation`);

const router = express.Router();

//* GET BOOKINGS USING CURRENT USER

router.get(`/current`, requireAuth, async (req, res, next) => {
  const currentUserId = req.user.dataValues.id;
  const bookings = await Booking.findAll({
    where: { userId: currentUserId },
    include: {
      model: Spot,
      include: { model: SpotImage },
      attributes: [
        `id`,
        `ownerId`,
        `address`,
        `city`,
        `state`,
        `country`,
        `lat`,
        `lng`,
        `name`,
        `price`,
      ],
    },
  });

  let listOfBookings = [];

  bookings.forEach((booking) => {
    listOfBookings.push(booking.toJSON());
  });

  listOfBookings.forEach((booking) => {
    booking.Spot.SpotImages.forEach((image) => {
      booking.Spot.previewImage = image.url;
      delete booking.Spot.SpotImages;
    });
  });

  return res.status(200).json({ Bookings: listOfBookings });
});

module.exports = router;

//! THIS IS A TEST
