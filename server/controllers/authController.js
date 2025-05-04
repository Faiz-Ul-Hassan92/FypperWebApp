const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator'); // For email validation

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expiration
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  const { name, email, password, role, skills, expertise, company } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user object based on role
    const userData = { name, email, password, role };
    if (role === 'student' && skills) userData.skills = skills;
    if (role === 'supervisor' && expertise) userData.expertise = expertise;
    if (role === 'recruiter' && company) userData.company = company;
    // Add other role-specific fields as needed

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during registration' });
    // Consider passing error to a more robust error handler
    // next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    console.log('Login attempt for email:', email);

    // Check for user
    const user = await User.findOne({ email }); // Password is selected by default
    console.log('User found:', user ? 'Yes' : 'No');

    if (user) {
      console.log('User role:', user.role);
      const isPasswordValid = await user.comparePassword(password);
      console.log('Password valid:', isPasswordValid);

      if (isPasswordValid) {
      res.json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during login' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  // req.user is attached by the protect middleware
  // Send back user data excluding potentially sensitive info if needed
  // For now, sending the user object attached by middleware (which excludes password)
  res.status(200).json({ success: true, data: req.user });
}; 