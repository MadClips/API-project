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

const router = express.Router();

//* DELETE SPOT IMAGE

router.delete(`/:imageId`, requireAuth, async (req, res, next) => {
  const spotImage = await SpotImage.findByPk(req.params.imageId, {
    include: { model: Spot },
  });

  if (!spotImage) {
    return res.status(404).json({ message: `Spot Image couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const spotImageOwnerId = spotImage.dataValues.Spot.dataValues.ownerId;

  if (currentUserId !== spotImageOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  await spotImage.destroy();

  res.status(200).json({ message: `Successfully deleted` });
});

module.exports = router;
