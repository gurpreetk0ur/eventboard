const express = require('express');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.get('/user', ctrl.getCurrentUser);
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);

module.exports = router;
