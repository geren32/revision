const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('orders_form_results', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        title:{
          type:DataTypes.STRING(255)
        },
        type:{
          type:DataTypes.TINYINT(1)
        },
        name_field:{
            type:DataTypes.STRING(255)
        },
        value:{
          type:DataTypes.TEXT
        },
        orders_id:{
            type:DataTypes.INTEGER
        },
        step:{
            type:DataTypes.INTEGER
        },
        service_id:{
            type:DataTypes.INTEGER
        },
        position:{
            type:DataTypes.INTEGER
        },
        service_form_id:{
            type:DataTypes.INTEGER
        },
        is_private:{
          type:DataTypes.STRING(55)
        },
        apartment:{
            type:DataTypes.STRING(55)
        },
        house:{
            type:DataTypes.STRING(55)
        },
        service_form_field_id:{
          type:DataTypes.INTEGER
        },
    }, {

        tableName: 'orders_form_results',
        timestamps: false,
    });
};
