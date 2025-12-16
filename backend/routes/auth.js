const express = require('express');
const router = express.Router();
const authController = require('../../controller/authControl');

router.post('/login-vulnerable', authController.loginVulnerable);
router.post('/login-secure', authController.loginSecure);
router.post('/logout', authController.logout);
router.get('/current-user', authController.getCurrentUser);

module.exports = router;