const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "reviews",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            origin_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            lang: {
                type: DataTypes.CHAR(2),
                allowNull: true
            },
            icon_id: {
                type: DataTypes.INTEGER,
            },
            user_image_id: {
                type: DataTypes.INTEGER,
            },

            user_name:{
                type:DataTypes.STRING(255)
            },
            comment:{
                type:DataTypes.TEXT
            },
            link:{
              type:DataTypes.STRING(255)
            },
            status:{
              type:DataTypes.TINYINT(1)
            },
            phone:{
              type:DataTypes.STRING(255)
            },
            contact_type:{
              type:DataTypes.TINYINT(1)
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                }
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                }
            }
        },
        {
            tableName: "reviews",
            timestamps: false,
        }
    );
};
