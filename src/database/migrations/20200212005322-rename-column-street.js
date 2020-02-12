module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('recipients', 'street', 'adress');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('recipients', 'adress', 'street');
  },
};
