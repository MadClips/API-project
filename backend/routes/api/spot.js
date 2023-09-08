const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const {
  Spot,
  SpotImage,
  Review,
  User,
  ReviewImage,
  sequelize,
} = require(`../../db/models`);

const { check } = require(`express-validator`);
const { handleValidationErrors } = require(`../../utils/validation`);

const router = express.Router();

//* GET SPOTS BY CURRENT USER

router.get(`/current`, requireAuth, async (req, res, _next) => {
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
  return res.status(200).json({ Spots: listOfSpots });
});

//* GET REVIEWS BY SPOT ID

router.get(`/:spotId/reviews`, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId);
  if (!spot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }
  const reviews = await Review.findAll({
    where: { spotId: req.params.spotId },
    include: [
      { model: User, attributes: [`id`, `firstName`, `lastName`] },
      { model: ReviewImage, attributes: [`id`, `url`] },
    ],
  });

  res.status(200).json({ Reviews: reviews });
});

//* GET DETAILS BY SPOT ID

router.get(`/:spotId`, async (req, res, _next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      { model: Review },
      { model: SpotImage, attributes: [`id`, `url`, `preview`] },
      { model: User, as: `Owner`, attributes: [`id`, `firstName`, `lastName`] },
    ],
  });

  if (!spot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
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

  return res.status(200).json(spotData);
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

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .isFloat()
    .withMessage("Latitude is not valid"),
  check("lng")
    .exists({ checkFalsy: true })
    .isFloat()
    .withMessage("Longitude is not valid"),
  check("name")
    .exists({ checkFalsy: true })
    .isLength({ min: 4, max: 49 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Price per day is required"),
  handleValidationErrors,
];

//* CREATE AN IMAGE FOR A SPOT USING SPOT ID

router.post(`/:spotId/images`, requireAuth, async (req, res, _next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }
  const { url, preview } = req.body;

  const newImage = await currentSpot.createSpotImage({
    url,
    preview,
  });
  await currentSpot.save();
  const newImageData = newImage.toJSON();

  delete newImageData.spotId;
  delete newImageData.updatedAt;
  delete newImageData.createdAt;

  return res.status(200).json(newImageData);
});

//* CREATE A SPOT
router.post(`/`, requireAuth, validateSpot, async (req, res, _next) => {
  const currentUserId = req.user.dataValues.id;

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const newSpot = await Spot.create({
    address,
    ownerId: currentUserId,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });
  if (!newSpot) {
    return res.status(400).json();
  }
  res.status(201).json(newSpot);
});

//* EDIT A SPOT
router.put(`/:spotId`, requireAuth, validateSpot, async (req, res, _next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  if (address) {
    currentSpot.address = address;
  }
  if (city) {
    currentSpot.city = city;
  }
  if (state) {
    currentSpot.state = state;
  }
  if (country) {
    currentSpot.country = country;
  }
  if (lat) {
    currentSpot.lat = lat;
  }
  if (lng) {
    currentSpot.lng = lng;
  }
  if (name) {
    currentSpot.name = name;
  }
  if (description) {
    currentSpot.description = description;
  }
  if (price) {
    currentSpot.price = price;
  }

  await currentSpot.save();
  return res.status(200).json(currentSpot);
});

//* DELETE A SPOT

router.delete(`/:spotId`, requireAuth, async (req, res, next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  await currentSpot.destroy();

  res.status(200).json({ message: `Successfully deleted` });
});

module.exports = router;
