const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('orders', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(255),
        },
        service_id: {
            type: DataTypes.INTEGER,
        },
        email:{
          type:DataTypes.STRING(255),
        },
        city:{
            type:DataTypes.STRING(255),
        },
        department:{
            type:DataTypes.STRING(255),
        },
        service_type:{
            type:DataTypes.TINYINT(1),
        },
        delivery_price:{
            type:DataTypes.INTEGER,
        },
        delivery_type:{
            type:DataTypes.TINYINT(1),
        },
        price:{
            type:DataTypes.INTEGER,
        },
        court_price:{
            type:DataTypes.STRING(255),
        },
        court_id:{
          type:DataTypes.INTEGER,
        },
        total_price:{
            type:DataTypes.INTEGER,
        },
        pay_type:{
            type:DataTypes.TINYINT(1),
        },
        pay_status:{
            type:DataTypes.TINYINT(1),
        },
        status:{
            type:DataTypes.INTEGER,
        },
        send_status:{
          type:DataTypes.TINYINT(1),
        },
        send_time:{
          type:DataTypes.DATE,
        },
        is_court_send: {
            type:DataTypes.TINYINT(1),
        },
        request_id: {
            type:DataTypes.STRING(255),
        },
        subscription_id: {
            type:DataTypes.STRING(255),
        },
        user_phone:{
          type:DataTypes.STRING(255),
        },
        user_name:{
          type:DataTypes.STRING(255),
        },
        comment:{
          type:DataTypes.TEXT,
        },
        additional_id:{
          type:DataTypes.INTEGER,
        },
        parent_order_id: {
            type:DataTypes.INTEGER,
        },
        signature_request_id: {
            type:DataTypes.STRING(255),
        },
        admin_sign: {
            type:DataTypes.TINYINT(1),
        },
        user_sign: {
            type:DataTypes.TINYINT(1),
        },
        hello_sign_file_response: {
            type:DataTypes.TINYINT(1),
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
    }, {

        tableName: 'orders',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }

    });
};
