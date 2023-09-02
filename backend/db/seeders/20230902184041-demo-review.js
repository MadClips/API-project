"use strict";

const { Review } = require(`../models`);
let options = {};
if (process.env.NODE_ENV == `production`) {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        review: `This spot was ok.`,
        stars: 3,
      },
      {
        spotId: 2,
        userId: 2,
        review: `This spot was great.`,
        stars: 4,
      },
      {
        spotId: 3,
        userId: 3,
        review: `This spot was amazing.`,
        stars: 5,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = `Reviews`;
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      userId: { [Op.in]: [1, 2, 3] },
    });
  },
};
