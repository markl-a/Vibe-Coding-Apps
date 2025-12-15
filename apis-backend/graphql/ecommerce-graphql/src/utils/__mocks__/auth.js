/**
 * Mock for utils/auth module
 */

const generateToken = jest.fn();
const verifyToken = jest.fn();
const getUserFromRequest = jest.fn();
const hashPassword = jest.fn();
const comparePassword = jest.fn();
const requireAuth = jest.fn();

module.exports = {
  generateToken,
  verifyToken,
  getUserFromRequest,
  hashPassword,
  comparePassword,
  requireAuth
};
