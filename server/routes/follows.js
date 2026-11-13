const express = require('express');
const ctrl = require('../controllers/followController');
const { isAuthenticated, validId } = require('../middlewares/auth');

const router = express.Router();
router.use(isAuthenticated);

router.get('/', ctrl.list);
router.get('/:organiserId', validId('organiserId'), ctrl.status);
router.post('/:organiserId', validId('organiserId'), ctrl.follow);
router.delete('/:organiserId', validId('organiserId'), ctrl.unfollow);

module.exports = router;
