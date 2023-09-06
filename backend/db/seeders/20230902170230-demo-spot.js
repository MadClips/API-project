"use strict";

const { Spot } = require(`../models`);
let options = {};
if (process.env.NODE_ENV === `production`) {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "3590 Alpha Avenue",
        city: "Jacksonville Beach",
        state: "Florida",
        country: "United States of America",
        lat: 30.342314,
        lng: -81.420715,
        name: "Demo Lition",
        description: "Demo's home.",
        price: 135,
      },
      {
        ownerId: 2,
        address: "3439 Byers Lane",
        city: "Marysville",
        state: "California",
        country: "United States of America",
        lat: 39.06868,
        lng: -121.517296,
        name: "Philippa Taylor",
        description: "Philippa's home.",
        price: 185,
      },
      {
        ownerId: 3,
        address: "4097 Ferguson Street",
        city: "Cambridge",
        state: "Massachusetts",
        country: "United States of America",
        lat: 42.441883,
        lng: -71.127846,
        name: "Sana Cherry",
        description: "Sana's home",
        price: 206,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Spots";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      address: {
        [Op.in]: [
          "3590 Alpha Avenue",
          "3439 Byers Lane",
          "4097 Ferguson Street",
        ],
      },
    });
  },
};
