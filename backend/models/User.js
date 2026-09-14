const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Google sign-in users won't have a password or phone initially
    password: { type: String, required: false },
    phone: { type: String, required: false },
    // Google OAuth integration fields
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    // Address & metadata
    postalCode: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);