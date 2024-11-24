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
      // define association here
    }
  }
  Analysis.init({
    analysis_id: DataTypes.INTEGER,
    note_id: DataTypes.INTEGER,
    predicted_status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Analysis',
    tableName: 'analysis',
  });
  return Analysis;
};