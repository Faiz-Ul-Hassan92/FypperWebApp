const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Optional: Set token from cookie if you implement cookie-based auth
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to the request object
    req.user = await User.findById(decoded.id).select('-password'); // Exclude password

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found, authorization denied' });
    }

    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not attached to request, authorization denied' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
          success: false, 
          message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
}; 