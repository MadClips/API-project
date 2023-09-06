const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const { Spot, SpotImage, Review, User, sequelize } = require(`../../db/models`);

const router = express.Router();

//* GET DETAILS BY SPOT ID

router.get(`/:spotId`, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      { model: Review },
      { model: SpotImage, attributes: [`id`, `url`, `preview`] },
      { model: User, as: `Owner`, attributes: [`id`, `firstName`, `lastName`] },
    ],
  });

  if (!spot) {
    res.status(404).json({ message: `Spot couldn't be found` });
  }

  const spotData = spot.toJSON();
  let listOfReviewStars = [];
  let numReviews = 0;

  spotData.Reviews.forEach((review) => {
    listOfReviewStars.push(review.stars);
    numReviews++;
  });

  let sum = 0;
  for (let i = 0; i < listOfReviewStars.length; i++) {
    sum += listOfReviewStars[i];
  }

  let average = sum / listOfReviewStars.length;
  spotData.avgRating = average;
  spotData.numReviews = numReviews;
  delete spotData.Reviews;

  res.status(200).json(spotData);
});

//* GET DETAILS BY SPOT ID

//* GET SPOTS BY CURRENT USER
router.get(`/current`, requireAuth, async (req, res, next) => {
  const userId = req.user.dataValues.id;
  const spots = await Spot.findAll({
    where: { ownerId: userId },
    include: [{ model: Review }, { model: SpotImage }],
  });
  let listOfSpots = [];

  spots.forEach((spot) => {
    listOfSpots.push(spot.toJSON());
  });

  listOfSpots.forEach((spot) => {
    let listOfReviewStars = [];

    spot.Reviews.forEach((review) => {
      listOfReviewStars.push(review.stars);
    });
    let sum = 0;
    for (let i = 0; i < listOfReviewStars.length; i++) {
      sum += listOfReviewStars[i];
    }
    let average = sum / listOfReviewStars.length;
    spot.avgRating = average;
    delete spot.Reviews;
  });

  listOfSpots.forEach((spot) => {
    spot.SpotImages.forEach((image) => {
      if (image.preview) {
        spot.previewImage = image.url;
        delete spot.SpotImages;
      }
    });
  });
  res.status(200).json({ Spots: listOfSpots });
});

//* GET ALL SPOTS
router.get(`/`, async (_req, res, _next) => {
  const spots = await Spot.findAll({
    include: [{ model: Review }, { model: SpotImage }],
  });

  let listOfSpots = [];

  spots.forEach((spot) => {
    listOfSpots.push(spot.toJSON());
  });

  listOfSpots.forEach((spot) => {
    let listOfReviewStars = [];

    spot.Reviews.forEach((review) => {
      listOfReviewStars.push(review.stars);
    });
    let sum = 0;
    for (let i = 0; i < listOfReviewStars.length; i++) {
      sum += listOfReviewStars[i];
    }
    let average = sum / listOfReviewStars.length;
    spot.avgRating = average;
    delete spot.Reviews;
  });

  listOfSpots.forEach((spot) => {
    spot.SpotImages.forEach((image) => {
      if (image.preview) {
        spot.previewImage = image.url;
        delete spot.SpotImages;
      }
    });
  });

  res.status(200).json({ Spots: listOfSpots });
});
//* GET ALL SPOTS
module.exports = router;
