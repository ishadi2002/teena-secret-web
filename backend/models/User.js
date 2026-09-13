const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  postalCode: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  // පාස්වර්ඩ් රීසෙට් කිරීම සඳහා අවශ්‍ය Fields දෙක එකතු කිරීම
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);