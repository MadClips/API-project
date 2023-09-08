const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const {
  Review,
  Spot,
  ReviewImage,
  User,
  SpotImage,
} = require(`../../db/models`);

const router = express.Router();

//* GET REVIEWS BY CURRENT USER
router.get(`/current`, requireAuth, async (req, res, next) => {
  const currentUserId = req.user.dataValues.id;
  const reviews = await Review.findAll({
    where: { userId: currentUserId },
    include: [
      { model: User, attributes: [`id`, `firstName`, `lastName`] },
      {
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
      { model: ReviewImage, attributes: [`id`, `url`] },
    ],
  });

  let listOfReviews = [];

  reviews.forEach((review) => {
    listOfReviews.push(review.toJSON());
  });

  listOfReviews.forEach((review) => {
    review.Spot.SpotImages.forEach((image) => {
      review.Spot.previewImage = image.url;
      delete review.Spot.SpotImages;
    });
  });

  return res.status(200).json({ Reviews: listOfReviews });
});

module.exports = router;
