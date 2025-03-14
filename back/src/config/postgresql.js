const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: msg => console.log(`SQL: ${msg}`), // Enable for debugging SQL queries
  pool: {
    max: 5, // Maximum number of connections in the pool
    min: 0, // Minimum number of connections in the pool
    acquire: 30000, // Maximum time (ms) to get a connection
    idle: 10000, // Maximum time (ms) a connection can be idle before being released
  },
});

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
};

const closePostgreSQL = async () => {
  console.log('Attempting to close PostgreSQL connection...');
  try {
    await sequelize.close();
    console.log('PostgreSQL connection closed');
  } catch (err) {
    console.error('Error closing PostgreSQL connection:', err);
  }
};

module.exports = { sequelize, connectPostgreSQL, closePostgreSQL };
