const { DataTypes } = require('sequelize');
const config = require('../../configs/config')
module.exports = (sequelize) => {
    sequelize.define('user', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            //allowNull: false,
        },
        cognito_id: {
            type: DataTypes.STRING(255),
            //allowNull: false,
        },
        username: {
            type: DataTypes.STRING(255),
            //allowNull: false,
        },
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: config.CLIENT_ROLE
        },
        confirm_token: {
            type: DataTypes.STRING(255),
        },
        confirm_token_type: {
            type: DataTypes.STRING(255),
        },
        confirm_token_expires: {
            type: DataTypes.STRING(255),
        },
        email_verified: {
            type: DataTypes.TINYINT,
        },
        status: {
            type: DataTypes.TINYINT,
        },
        first_name: {
            type: DataTypes.STRING(255),
        },
        last_name: {
            type: DataTypes.STRING(255),
        },
        father_name: {
            type: DataTypes.STRING(255),
        },
        phone: {
            type: DataTypes.STRING(255),
        },
        address: {
            type: DataTypes.STRING(255),
        },
        street: {
            type: DataTypes.STRING(255),
        },
        house: {
            type: DataTypes.STRING(255),
        },
        apartment: {
            type: DataTypes.STRING(255),
        },
        contract_id: {
            type: DataTypes.INTEGER,
        },
        birthday_date: {
            type: DataTypes.DATE,
        },
        confirm_token_time: {
            type: DataTypes.DATE,
        },
        confirm_token_count: {
            type: DataTypes.INTEGER,
        },
        user_sign: {
            type: DataTypes.TINYINT,
        },
        admin_sign: {
            type: DataTypes.TINYINT,
        },
        signature_request_id: {
            type: DataTypes.STRING(255),
        },
        hello_sign_file_response: {
            type: DataTypes.TINYINT,
        },
        refresh_token: {
            type: DataTypes.TEXT,
        },
        access_token: {
            type: DataTypes.TEXT,
        },
        inn:{
          type:DataTypes.STRING(255),
        },
        num_passport:{
          type:DataTypes.STRING(255)
        },
        is_private:{
          type:DataTypes.TINYINT(1)
        },
        filter_phone:{
          type:DataTypes.STRING(255)
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
        tableName: 'user',
        timestamps: false,
    });
};
