"use strict";

const { Booking } = require(`../models`);
let options = {};
if (process.env.NODE_ENV === `production`) {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        startDate: "2022-06-15",
        endDate: "2022-06-16",
      },
      {
        spotId: 1,
        userId: 1,
        startDate: "2022-05-05",
        endDate: "2022-05-07",
      },
      {
        spotId: 1,
        userId: 1,
        startDate: "2022-07-25",
        endDate: "2022-07-28",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = `Bookings`;
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      userId: { [Op.in]: [1, 2, 3] },
    });
  },
};
