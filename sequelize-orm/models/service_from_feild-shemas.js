const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "service_form_field",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            title:{
                type:DataTypes.STRING(255)
            },
            name_field:{
                type:DataTypes.STRING(255)
            },

            type:{
                type:DataTypes.TINYINT(1)
            },
            required:{
                type:DataTypes.TINYINT(1)
            },
            service_form_id:{
                type:DataTypes.INTEGER
            },
            position:{
              type:DataTypes.INTEGER
            },
            placeholder:{
                type:DataTypes.STRING(255)
            },
            width:{
                type:DataTypes.STRING(255)
            },
            for_registration:{
                type:DataTypes.TINYINT(1)
            },
            client_address:{
              type:DataTypes.TINYINT(1)
            },
            register_first:{
                type:DataTypes.TINYINT(1)
            },
            register_last:{
                type:DataTypes.TINYINT(1)
            },
            register_sur:{
                type:DataTypes.TINYINT(1)
            },
            maxlength:{
              type:DataTypes.INTEGER
            },
            client_inn:{
                type:DataTypes.TINYINT(1)
            },
            client_passport:{
                type:DataTypes.TINYINT(1)
            },
            client_date:{
                type:DataTypes.TINYINT(1)
            },
            hint:{
              type:DataTypes.STRING(255)
            },
            child_name_field:{
                type:DataTypes.STRING(255)
            },
            doc_1:{
                type:DataTypes.TEXT
            },
            doc_2:{
                type:DataTypes.TEXT
            },
            is_court:{
                type:DataTypes.TINYINT(1)
            },
            is_defendant:{
                type:DataTypes.TINYINT(1)
            }
        },
        {
            tableName: "service_form_field",
            timestamps: false,
        }
    );
};
