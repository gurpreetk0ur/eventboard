const express = require('express');
const ctrl = require('../controllers/notificationController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();
router.use(isAuthenticated);

router.get('/', ctrl.list);
router.patch('/seen', ctrl.markSeen);

module.exports = router;
