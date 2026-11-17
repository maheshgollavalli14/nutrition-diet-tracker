const { body } = require('express-validator');
const { isValidTimeZone } = require('../utils/dateUtils');

const registerRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .isLength({ max: 191 })
    .withMessage('Email address must be at most 191 characters.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters.'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password and confirm password do not match.');
      }
      return true;
    }),
  body('timezone')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !isValidTimeZone(value)) {
        throw new Error('Invalid IANA timezone.');
      }
      return true;
    }),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const profileRules = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('timezone')
    .optional()
    .custom((value) => {
      if (!isValidTimeZone(value)) {
        throw new Error('Invalid IANA timezone.');
      }
      return true;
    }),
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
};
