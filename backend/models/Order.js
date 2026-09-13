const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Register වුණු user කෙනෙක් නම් පමණක් user ID එක වැටේ (optional)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  // Register නොවූ (Guest) හෝ register වූ ඕනෑම කෙනෙකුගේ contact විස්තර
  customerDetails: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, default: '' }
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);