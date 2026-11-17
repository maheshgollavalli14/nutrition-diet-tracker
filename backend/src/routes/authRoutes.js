const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { registerRules, loginRules, profileRules } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerRules, validateRequest, authController.register);
router.post('/login', loginRules, validateRequest, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, profileRules, validateRequest, authController.updateProfile);

module.exports = router;
