module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('delivery_problems', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('delivery_problems', 'id');
  },
};
