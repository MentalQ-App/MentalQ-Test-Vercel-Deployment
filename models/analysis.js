'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Analysis extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Analysis.belongsTo(models.Notes, {
        foreignKey: 'note_id',
        as: 'note', 
      });
    }
  }
  Analysis.init({
    analysis_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'analysis_id',
    },
    note_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notes',
        key: 'note_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    predicted_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Analysis',
    tableName: 'analysis',
  });
  return Analysis;
};