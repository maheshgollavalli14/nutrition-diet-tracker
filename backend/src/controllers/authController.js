const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    timezone: req.body.timezone,
  });

  res.status(201).json({
    message: 'Account created successfully.',
    ...result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  res.status(200).json({
    message: 'Logged in successfully.',
    ...result,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'Logged out successfully.',
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, {
    fullName: req.body.fullName,
    timezone: req.body.timezone,
  });

  res.status(200).json({
    message: 'Profile updated successfully.',
    user,
  });
});

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
};
