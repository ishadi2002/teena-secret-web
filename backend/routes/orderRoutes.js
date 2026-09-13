const express = require('express');
const router = express.Router();
const { createOrder, getOrderById, updateOrderStatus } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/:orderNumber', getOrderById);

// Order එකේ Status එක Update කර (Confirmed/Completed කර) ඊමේල් යවන Route එක
router.put('/:id/status', updateOrderStatus);

module.exports = router;