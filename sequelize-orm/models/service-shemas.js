const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "service",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },

            origin_id: {
                type: DataTypes.INTEGER,
            },
            lang:{
                type:DataTypes.CHAR(2)
            },
            template_doc:{
                type:DataTypes.TEXT
            },
            status:{
                type:DataTypes.TINYINT(1)
            },
            description:{
              type:DataTypes.TEXT
            },
            title:{
                type:DataTypes.STRING(255)
            },
            price:{
                type:DataTypes.INTEGER
            },
            count_price:{
              type:DataTypes.INTEGER
            },
            image_id:{
              type:DataTypes.INTEGER
            },
            image_prev_id:{
                type:DataTypes.INTEGER
            },
            position:{
                type:DataTypes.INTEGER
            },
            informer:{
                type:DataTypes.TEXT
            },
            type:{
              type:DataTypes.TINYINT(1)
            },
            options :{
              type:DataTypes.TEXT
            },
            preview:{
              type:DataTypes.INTEGER
            },
            dont_send_to_court:{
              type:DataTypes.TINYINT(1)
            },
            not_show_dia: {
                type:DataTypes.TINYINT(1),
            },
            template_hello_sign: {
                type:DataTypes.TEXT
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
            tableName: "service",
            timestamps: false,
        }
    );
};
