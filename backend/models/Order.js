const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  paymentMethod: { type: String, enum: ['Cash on Delivery', 'PayHere Card', 'WhatsApp Order'], required: true },
  paymentStatus: { type: String, default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
