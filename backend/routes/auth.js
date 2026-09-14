const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is missing.' });
    }

    // 1. Verify Google token authenticity
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 2. Check if user already exists with this googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 3. Check if an account already exists with the same email (e.g. manual sign-up)
      user = await User.findOne({ email });

      if (user) {
        // Account linking: Attach the googleId and update avatar if empty
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        // 4. Brand new user: Create a new account
        user = await User.create({
          name: name || 'Google User',
          email,
          googleId,
          avatar: picture || '',
          role: 'customer',
          // password, phone, address fields default safely based on schema
        });
      }
    }

    // 5. Generate your app session JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Return the session token and user payload (omit sensitive info)
    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || '',
        city: user.city || '',
        address: user.address || '',
        postalCode: user.postalCode || '',
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google authentication failed or token is invalid.' });
  }
});

module.exports = router;