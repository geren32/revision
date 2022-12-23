const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('promocode', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(255),
            // allowNull: false
        },
        discount: {
            type: DataTypes.INTEGER,
            // allowNull: false
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        type: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            // allowNull: true
        },
        usage_count: {
            type: DataTypes.INTEGER,
            //allowNull: false,
            defaultValue: 0
        },
        total_usage: {
            type: DataTypes.INTEGER,
            // allowNull: false,
            defaultValue: 0
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
        }
    }, {

        tableName: 'promocode',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }

    });
};