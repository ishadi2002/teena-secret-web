const Order = require('../models/Order');

// 1. අලුත් Order එකක් දැමීම (Registered user කෙනෙක්ට හෝ Guest කෙනෙක්ට)
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, customerDetails, paymentMethod } = req.body;

    // Items පරීක්ෂා කිරීම
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items cannot be empty' });
    }

    // Customer විස්තර පරීක්ෂා කිරීම
    if (!customerDetails || !customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, phone number, and address are required' 
      });
    }

    const orderData = {
      // Login වී ඇත්නම් user id එක දමයි, නැතිනම් null (Guest)
      user: req.user ? (req.user._id || req.user.id) : null,
      customerDetails: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        email: customerDetails.email || '',
        address: customerDetails.address,
        city: customerDetails.city || '',
        postalCode: customerDetails.postalCode || ''
      },
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      status: 'Pending'
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Admin ට සියලු orders (Guest + Registered) ලබා ගැනීම
exports.getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('items.product', 'title price imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Admin විසින් Order Status Confirm / Update කිරීම
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // උදා: 'Confirmed', 'Processing', 'Delivered', 'Cancelled'

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Logged-in User කෙනෙකුට තමන්ගේ Orders පමණක් බලා ගැනීම
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'title price imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. තනි Order එකක විස්තර Order ID එකෙන් ලබා ගැනීම
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'title price imageUrl');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};