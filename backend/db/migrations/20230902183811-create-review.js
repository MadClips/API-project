"use strict";

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

options.tableName = "Reviews";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Reviews",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        spotId: {
          type: Sequelize.INTEGER,
          references: { model: `Spots` },
          onDelete: `CASCADE`,
          hooks: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          references: { model: `Users` },
          onDelete: `CASCADE`,
          hooks: true,
        },
        review: {
          type: Sequelize.STRING,
        },
        stars: {
          type: Sequelize.INTEGER,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      options
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(options);
  },
};
