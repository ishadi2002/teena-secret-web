const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 1. Mail transporter එක සකස් කිරීම
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, postalCode, address, city, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      postalCode: postalCode || '',
      address: address || '',
      city: city || '',
      role: role || 'customer'
    });

    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Forgot Password - ඊමේල් එකට රීසෙට් ලින්ක් එකක් යැවීම
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // විනාඩි 10 කින් කල් ඉකුත් වේ
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      from: 'Teena\'s Secret <' + process.env.EMAIL_USER + '>',
      to: user.email,
      subject: 'Password Reset Request - Teena\'s Secret',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d4af37;">Teena's Secret Beauty Store</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If you didn't request this, please ignore this email. This link is valid for 10 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Reset Password - අලුත් පාස්වර්ඩ් එක හැෂ් කර සේව් කිරීම
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // නව පාස්වර්ඩ් එක සාර්ථකව Hash කර සේව් කිරීම
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};