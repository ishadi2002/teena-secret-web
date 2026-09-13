const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['Skin Care', 'Body Care', 'Hair Care', 'Serums', 'Facial Sets'],
    required: true 
  },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  images: [{ type: String, required: true }],
  description: { type: String, required: true },
  benefits: [{ type: String }],
  stock: { type: Number, default: 15 },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
