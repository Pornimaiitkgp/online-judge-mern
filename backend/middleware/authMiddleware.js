// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken'; // For token verification
import User from '../models/user.model.js'; // Assuming your User model is here and uses default export

/**
 * Middleware to authenticate user based on JWT token.
 * It checks for a token in the Authorization header, verifies it,
 * and attaches the decoded user information to `req.user`.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateUser = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the token payload and attach to request
      // Select -password to exclude the password hash from the user object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware factory to authorize users based on their roles.
 * It takes an array of allowed roles and returns a middleware function.
 * This middleware should be used AFTER authenticateUser.
 *
 * @param {Array<string>} roles - An array of roles that are allowed to access the route (e.g., ['admin', 'moderator'])
 * @returns {Function} Express middleware function
 */
export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Ensure req.user exists (authenticateUser must run before this)
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied: User not authenticated.' });
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: User role '${req.user.role}' is not authorized.` });
    }

    next(); // User is authorized, proceed
  };
};