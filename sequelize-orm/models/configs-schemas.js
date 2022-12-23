const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('configs', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        lang: {
            type: DataTypes.STRING(45),
        },

        updated_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        type:{
            type:DataTypes.STRING(55)
        },
        value:{
            type:DataTypes.TEXT
        }
    }, {
        tableName: 'configs',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};
