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

const validateBooking = [
  check("startDate").exists({ checkFalsy: true }),
  check("endDate")
    .exists({ checkFalsy: true })
    .withMessage("endDate cannot be on or before startDate"),
  handleValidationErrors,
];

//* EDIT A BOOKING
router.put(
  `/:bookingId`,
  requireAuth,
  validateBooking,
  async (req, res, next) => {
    const currentBooking = await Booking.findByPk(req.params.bookingId);
    if (!currentBooking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }
    const currentUserId = req.user.dataValues.id;

    const currentBookingUserId = currentBooking.dataValues.userId;

    if (currentUserId !== currentBookingUserId) {
      return res.status(403).json({ message: `Forbidden` });
    }

    const currentSpot = await Spot.findByPk(currentBooking.dataValues.spotId, {
      include: [{ model: Booking }],
    });

    const { startDate, endDate } = req.body;

    const currentBookingStartDate = new Date(startDate);
    const currentBookingEndDate = new Date(endDate);

    const currentBookingStartDateTime = currentBookingStartDate.getTime();
    const currentBookingEndDateTime = currentBookingEndDate.getTime();

    const currentDate = new Date();
    const currentDateTime = currentDate.getTime();

    if (currentBookingEndDateTime < currentDateTime) {
      return res
        .status(403)
        .json({ message: `Past bookings can't be modified ` });
    }

    if (currentBookingStartDateTime >= currentBookingEndDateTime) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate",
        },
      });
    }

    let listOfBookings = [];
    const bookings = currentSpot.dataValues.Bookings;
    bookings.forEach((booking) => {
      listOfBookings.push(booking.toJSON());
    });

    for (let i = 0; i < listOfBookings.length; i++) {
      const reservedBookingStartDate = new Date(listOfBookings[i].startDate);
      const reservedBookingEndDate = new Date(listOfBookings[i].endDate);

      const reservedBookingStartDateTime = reservedBookingStartDate.getTime();
      const reservedBookingEndDateTime = reservedBookingEndDate.getTime();

      if (
        currentBookingStartDateTime >= reservedBookingStartDateTime &&
        currentBookingEndDateTime <= reservedBookingEndDateTime
      ) {
        return res.status(403).json({
          message: `Sorry, this spot is already booked for the specified dates`,
        });
      }

      if (
        currentBookingStartDateTime < reservedBookingStartDateTime &&
        currentBookingEndDateTime >= reservedBookingStartDateTime
      ) {
        return res
          .status(403)
          .json({ message: `End date conflicts with an existing booking` });
      }

      if (
        currentBookingStartDateTime <= reservedBookingEndDateTime &&
        currentBookingEndDateTime > reservedBookingEndDateTime
      ) {
        return res
          .status(403)
          .json({ message: `Start date conflicts with an existing booking` });
      }
    }

    if (startDate) {
      currentBooking.startDate = startDate;
    }
    if (endDate) {
      currentBooking.endDate = endDate;
    }

    await currentBooking.save();
    return res.status(200).json(currentBooking);
  }
);

//* DELETE A BOOKING
router.delete(`/:bookingId`, requireAuth, async (req, res, next) => {
  const currentBooking = await Booking.findByPk(req.params.bookingId);
  if (!currentBooking) {
    return res.status(404).json({ message: `Booking couldn't be found` });
  }
  const currentUserId = req.user.dataValues.id;
  const currentBookingUserId = currentBooking.dataValues.userId;
  if (currentUserId !== currentBookingUserId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  const currentDate = new Date();
  const currentDateTime = currentDate.getTime();

  const currentBookingStartDate = currentBooking.dataValues.startDate;
  const currentBookingEndDate = currentBooking.dataValues.endDate;

  const currentBookingStartDateTime = currentBookingStartDate.getTime();
  const currentBookingEndDateTime = currentBookingEndDate.getTime();

  if (currentBookingStartDateTime < currentDateTime) {
    return res
      .status(403)
      .json({ message: `Bookings that have been started can't be deleted` });
  }

  await currentBooking.destroy();
  res.status(200).json({ message: `Successfully deleted` });
});
module.exports = router;
