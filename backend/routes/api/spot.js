const express = require(`express`);

const { Spot, SpotImage, Review, sequelize } = require(`../../db/models`);

const router = express.Router();
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
