const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
  createOrder, 
  getAllOrdersForAdmin, 
  updateOrderStatus, 
  getMyOrders, 
  getOrderById 
} = require('../controllers/orderController');

// Token එකක් තිබුණොත් user විස්තර ගන්න, නැතිනම් guest ලෙස සලකන middleware එක
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// 1. Order එකක් දැමීම (Registered අය සහ Guest අය දෙගොල්ලන්ටම පුළුවන්)
router.post('/', optionalAuth, createOrder);

// 2. Admin ට සියලු orders (Guest + Registered) ලබා ගැනීම
router.get('/admin/all', getAllOrdersForAdmin);

// 3. Logged-in user කෙනෙකුට තමන්ගේ orders පමණක් බැලීම
router.get('/my-orders', optionalAuth, getMyOrders);

// 4. Order Status එක Confirm / Update කිරීම
router.put('/:id/status', updateOrderStatus);

// 5. තනි Order එකක විස්තර ID එකෙන් ලබා ගැනීම (අවසානයටම තබන්න)
router.get('/:id', getOrderById);

module.exports = router;