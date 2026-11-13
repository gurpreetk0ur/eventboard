const express = require('express');
const ctrl = require('../controllers/eventController');
const { isAuthenticated, validId } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ctrl.listEvents);
router.get('/:id', validId('id'), ctrl.getEvent);
router.post('/', isAuthenticated, ctrl.createEvent);
router.put('/:id', isAuthenticated, validId('id'), ctrl.updateEvent);
router.delete('/:id', isAuthenticated, validId('id'), ctrl.deleteEvent);

module.exports = router;
