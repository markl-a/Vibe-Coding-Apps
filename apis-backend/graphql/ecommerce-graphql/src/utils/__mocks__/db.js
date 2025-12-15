/**
 * Mock for utils/db module
 */

const query = jest.fn();
const pool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};

const initDatabase = jest.fn();

module.exports = {
  query,
  pool,
  initDatabase
};
