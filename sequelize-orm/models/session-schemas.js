const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  sequelize.define(
    "session",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
   
      user_id: {
        type: DataTypes.INTEGER,
      },
        access_token: {
        type: DataTypes.STRING(300),
    },
       refresh_token: {
        type: DataTypes.STRING(300),
    },
    expired:{
   type: DataTypes.DATE,
    },

   
    },
    {
      tableName: "session",
      timestamps: false,
    }
  );
};