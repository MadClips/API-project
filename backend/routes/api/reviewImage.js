const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const { Review, ReviewImage } = require(`../../db/models`);

const router = express.Router();

//* DELETE REVIEW IMAGE

router.delete(`/:imageId`, requireAuth, async (req, res, next) => {
  const reviewImage = await ReviewImage.findByPk(req.params.imageId, {
    include: { model: Review },
  });
  if (!reviewImage) {
    return res.status(404).json({ message: `Review Image couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const reviewImageUserId = reviewImage.dataValues.Review.dataValues.userId;

  if (currentUserId !== reviewImageUserId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  await reviewImage.destroy();

  res.status(200).json({ message: `Successfully deleted` });
});

module.exports = router;
