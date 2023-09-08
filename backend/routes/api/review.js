const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const {
  Review,
  Spot,
  ReviewImage,
  User,
  SpotImage,
} = require(`../../db/models`);

const { check } = require(`express-validator`);
const { handleValidationErrors } = require(`../../utils/validation`);
const { route } = require("./spot");

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

const validateUrl = [
  check("url").exists({ checkFalsy: true }).withMessage("Url required"),
  handleValidationErrors,
];

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors,
];

//* CREATE IMAGE BASED ON REVIEW ID

router.post(
  `/:reviewId/images`,
  requireAuth,
  validateUrl,
  async (req, res, next) => {
    const review = await Review.findByPk(req.params.reviewId, {
      include: { model: ReviewImage },
    });

    if (!review) {
      return res.status(404).json({ message: `Review couldn't be found` });
    }

    const { url } = req.body;

    let listOfImages = [];
    const images = review.dataValues.ReviewImages;
    images.forEach((image) => {
      listOfImages.push(image.toJSON());
    });

    if (listOfImages.length === 10) {
      return res.status(403).json({
        message: `maximum number of images for this resource was reached`,
      });
    }

    const newImage = await review.createReviewImage({
      url,
    });

    await review.save();

    return res.status(200).json(newImage);
  }
);

//* EDIT A REVIEW

router.put(
  `/:reviewId`,
  requireAuth,
  validateReview,
  async (req, res, next) => {
    const currentReview = await Review.findByPk(req.params.reviewId);
    if (!currentReview) {
      return res.status(404).json({ message: `Review couldn't be found` });
    }

    const currentUserId = req.user.dataValues.id;

    const currentReviewUserId = currentReview.dataValues.userId;

    if (currentUserId !== currentReviewUserId) {
      return res.status(403).json({ message: `Forbidden` });
    }
    const { review, stars } = req.body;

    if (review) {
      currentReview.review = review;
    }
    if (stars) {
      currentReview.stars = stars;
    }

    await currentReview.save();
    return res.status(200).json(currentReview);
  }
);

//* DELETE REVIEW ROUTE

router.delete(`/:reviewId`, requireAuth, async (req, res, next) => {
  const currentReview = await Review.findByPk(req.params.reviewId);
  if (!currentReview) {
    return res.status(404).json({ message: `Review couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentReviewUserId = currentReview.dataValues.userId;

  if (currentUserId !== currentReviewUserId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  await currentReview.destroy();

  res.status(200).json({ message: `Successfully deleted` });
});

module.exports = router;
