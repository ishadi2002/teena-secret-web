import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const app = express();
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Railway dynamically assigns PORT (default fallback to 5000 for local development)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://teena_admin:Teena12345i@cluster.wci1ahb.mongodb.net/teena_store?retryWrites=true&w=majority&appName=Cluster";
const JWT_SECRET = process.env.JWT_SECRET || "teena_secret_jwt_key_2025";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "608866886188-siuifaas9ak8r7tjg1fq5rjo88f30vuc.apps.googleusercontent.com";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Official PayHere Sandbox Credentials
const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "1237984";
const MERCHANT_SECRET = process.env.PAYHERE_SECRET || "MzQyMjM1OTM2NjEyODkyMTExMjkzNDQwNDk5NDAzMTc1MDUzMDc3";

// Robust Nodemailer Transporter using Port 587 (STARTTLS)
// Uses family: 4 to prevent ENETUNREACH IPv6 routing errors on cloud containers
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Must be false for 587 (upgrades via STARTTLS)
  family: 4,     // Explicitly forces IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000 // Prevents infinite hanging
});

// Non-blocking asynchronous verification check (Never blocks Railway health check)
setTimeout(() => {
  transporter.verify((err) => {
    if (err) {
      console.warn('⚠️ [Email Transporter Status]: Verification failed or timed out:', err.message);
    } else {
      console.log('✅ [Email Transporter Status]: Ready to send emails via Gmail SMTP (Port 587).');
    }
  });
}, 4000);

// Helper: Welcome Email
const sendWelcomeEmail = async (customerEmail, customerName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email Warning]: Skipping welcome email. EMAIL_USER or EMAIL_PASS not defined.');
    return;
  }
  if (!customerEmail) return;

  try {
    const info = await transporter.sendMail({
      from: `"Teena's Secret" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: "Welcome to Teena's Secret! ✨",
      html: `
        <div style="background-color: #0b0b0b; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; border-radius: 12px; max-width: 550px; margin: auto; border: 1px solid #222;">
          <h1 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; font-size: 22px; text-align: center; margin-bottom: 5px;">Teena's Secret</h1>
          <p style="color: #888; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 0;">Glow Up With Confidence</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 20px 0;" />
          <h2 style="font-size: 18px; color: #fff;">Welcome, ${customerName || 'Valued Customer'}!</h2>
          <p style="color: #bbb; line-height: 1.6; font-size: 13px;">
            Thank you for registering with <strong>Teena's Secret</strong>. You now have access to our signature cosmetic collections, real-time order history, and express checkout.
          </p>
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="color: #f59e0b; font-weight: bold; margin: 0; font-size: 13px;">100% Authentic Organic Beauty Products</p>
            <p style="color: #888; margin: 5px 0 0 0; font-size: 11px;">Islandwide Cash on Delivery & Secure Online Card Payments</p>
          </div>
          <p style="color: #777; font-size: 11px; text-align: center; margin-top: 30px;">
            Need help? Contact us via WhatsApp or reply directly to this email.
          </p>
        </div>
      `
    });
    console.log(`[Email Dispatched]: Welcome email sent to ${customerEmail} (MessageId: ${info.messageId})`);
  } catch (err) {
    console.error('[Email Error - Registration]:', err.message);
  }
};

// Helper: Order Confirmation Email
const sendOrderConfirmationEmail = async (order) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email Warning]: Skipping order confirmation email. EMAIL_USER or EMAIL_PASS not defined.');
    return;
  }
  if (!order || !order.customerEmail) {
    console.warn('[Email Warning]: Order has no customerEmail. Confirmation email not sent.');
    return;
  }

  try {
    const itemsRows = (order.items || []).map(item => `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 10px 0; color: #ddd; font-size: 13px;">${item.name}</td>
        <td style="padding: 10px 0; color: #f59e0b; text-align: center; font-size: 13px;">x${item.quantity || 1}</td>
        <td style="padding: 10px 0; color: #ddd; text-align: right; font-family: monospace; font-size: 13px;">Rs. ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join('');

    const info = await transporter.sendMail({
      from: `"Teena's Secret" <${process.env.EMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmation - #${String(order._id).slice(-6).toUpperCase()}`,
      html: `
        <div style="background-color: #0b0b0b; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #222;">
          <h1 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; font-size: 22px; text-align: center; margin-bottom: 5px;">Teena's Secret</h1>
          <p style="color: #888; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 0;">Order Receipt</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 20px 0;" />
          <h2 style="font-size: 16px; color: #10b981; margin-bottom: 5px;">✓ Order Placed Successfully!</h2>
          <p style="color: #aaa; font-size: 12px; margin-top: 0;">Order ID: <strong style="color: #fff; font-family: monospace;">${order._id}</strong></p>
          
          <div style="background: #141414; border: 1px solid #222; border-radius: 8px; padding: 15px; margin: 15px 0; font-size: 12px;">
            <p style="margin: 3px 0; color: #aaa;"><strong>Recipient:</strong> ${order.customerName || 'Customer'}</p>
            <p style="margin: 3px 0; color: #aaa;"><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
            <p style="margin: 3px 0; color: #aaa;"><strong>Delivery Address:</strong> ${order.customerAddress || 'N/A'}</p>
            <p style="margin: 3px 0; color: #aaa;"><strong>Payment Mode:</strong> <span style="color: #f59e0b;">${order.paymentMethod || 'COD'}</span></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #333; text-align: left; color: #777; font-size: 10px; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
            <span style="color: #888; font-size: 12px; text-transform: uppercase;">Total Amount:</span>
            <span style="color: #f59e0b; font-size: 20px; font-weight: bold; font-family: monospace; margin-left: 10px;">Rs. ${(order.totalAmount || 0).toLocaleString()}</span>
          </div>

          <p style="color: #777; font-size: 11px; text-align: center; margin-top: 30px;">
            Thank you for shopping with Teena's Secret. Your order will be dispatched promptly.
          </p>
        </div>
      `
    });
    console.log(`[Email Dispatched]: Order confirmation sent to ${order.customerEmail} (MessageId: ${info.messageId})`);
  } catch (err) {
    console.error('[Email Error - Order Confirmation]:', err.message);
  }
};

setInterval(() => {}, 1 << 30);

// Root Route (Railway Health Check)
app.get('/', (req, res) => {
  res.json({ success: true, message: "Teena's Secret Backend is Running Successfully on Railway!" });
});

// Product Schema & Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: Number,
  description: String,
  image: String,
  rating: { type: Number, default: 5 },
  isSpecialOffer: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'customer' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
let localUsers = [];

// Order Schema & Model
const orderSchema = new mongoose.Schema({
  items: Array,
  totalAmount: Number,
  customerName: String,
  customerEmail: { type: String, index: true },
  customerPhone: String,
  customerAddress: String,
  paymentMethod: { type: String, default: 'COD' },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

let localProducts = [
  {
    _id: "1",
    name: "Eye Serum – 20ml",
    category: "SKIN CARE",
    price: 1450,
    discountPrice: 1650,
    description: "Lightweight eye serum with a peptide formula, designed for the delicate eye area.",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
    rating: 5,
    isSpecialOffer: true
  }
];

let localOrders = [];

// --- PAYHERE HASH GENERATOR API ---
app.post('/api/payhere/hash', (req, res) => {
  const { order_id, amount, currency } = req.body;
  if (!order_id || !amount || !currency) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  const hashedSecret = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
  const amountFormatted = Number(amount).toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '');
  const hashString = MERCHANT_ID + order_id + amountFormatted + currency + hashedSecret;
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  res.json({
    success: true,
    merchant_id: MERCHANT_ID,
    hash
  });
});

// --- GOOGLE AUTH ROUTE ---
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is missing.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    let isNewUser = false;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ googleId });
        if (!user) {
          user = await User.findOne({ email: cleanEmail });
          if (user) {
            user.googleId = googleId;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save();
          } else {
            user = await User.create({
              name: name || 'Google User',
              email: cleanEmail,
              googleId,
              avatar: picture || '',
              role: 'customer',
            });
            isNewUser = true;
          }
        }
      } catch (dbErr) {
        console.error('Mongo Google Auth Error:', dbErr);
      }
    }

    if (!user) {
      user = localUsers.find(u => u.googleId === googleId || u.email === cleanEmail);
      if (user) {
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
      } else {
        user = {
          _id: Date.now().toString(),
          name: name || 'Google User',
          email: cleanEmail,
          googleId,
          avatar: picture || '',
          role: 'customer'
        };
        localUsers.push(user);
        isNewUser = true;
      }
    }

    if (isNewUser) {
      sendWelcomeEmail(cleanEmail, user.name);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || ''
      }
    });
  } catch (error) {
    console.error('Google Auth Route Error:', error);
    res.status(401).json({ success: false, message: 'Google authentication failed or token is invalid.' });
  }
});

// --- AUTH: LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    if (cleanEmail === 'admin@teenasecret.lk' && cleanPassword === 'teena2025') {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true,
        token,
        user: { name: "Teena (Admin)", email: cleanEmail, role: 'admin' }
      });
    }

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try { user = await User.findOne({ email: cleanEmail }).maxTimeMS(5000); } catch (e) {}
    }
    if (!user) user = localUsers.find(u => u.email === cleanEmail);

    if (!user) return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    if (!user.password) return res.status(400).json({ success: false, message: 'Please sign in with Google' });

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id || 'local', role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role, avatar: user.avatar || '' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AUTH: REGISTER ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city, postalCode } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    let exists = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const found = await User.findOne({ email: cleanEmail }).maxTimeMS(5000);
        if (found) exists = true;
      } catch (e) {}
    }
    if (!exists) exists = localUsers.some(u => u.email === cleanEmail);

    if (exists) return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const newUserObj = { 
      _id: Date.now().toString(), 
      name, 
      email: cleanEmail, 
      password: hashedPassword, 
      phone: phone || '', 
      address: address || '', 
      city: city || '', 
      postalCode: postalCode || '',
      role: 'customer' 
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const dbUser = new User(newUserObj);
        await dbUser.save();
      } catch (e) { localUsers.push(newUserObj); }
    } else { localUsers.push(newUserObj); }

    // Dispatch welcome email
    sendWelcomeEmail(cleanEmail, name);

    const token = jwt.sign({ email: cleanEmail, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name, email: cleanEmail, role: 'customer' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- EDIT PROFILE ROUTE ---
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, name, phone, address, city, postalCode } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let updatedUser = null;

    if (mongoose.connection.readyState === 1) {
      updatedUser = await User.findOneAndUpdate(
        { email: cleanEmail },
        { name, phone, address, city, postalCode },
        { new: true }
      );
    }

    if (!updatedUser) {
      const idx = localUsers.findIndex(u => u.email === cleanEmail);
      if (idx !== -1) {
        localUsers[idx] = { ...localUsers[idx], name, phone, address, city, postalCode };
        updatedUser = localUsers[idx];
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || '',
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        city: updatedUser.city || '',
        postalCode: updatedUser.postalCode || ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PRODUCT ROUTES ---
app.get('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbProducts = await Product.find().sort({ createdAt: -1 });
      if (dbProducts.length > 0) return res.json({ success: true, products: dbProducts });
    }
  } catch (e) {}
  res.json({ success: true, products: localProducts });
});

app.post('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const p = new Product(req.body);
      await p.save();
      return res.json({ success: true, product: p });
    }
  } catch (e) {}
  const newProd = { ...req.body, _id: Date.now().toString() };
  localProducts.unshift(newProd);
  res.json({ success: true, product: newProd });
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
      if (updated) return res.json({ success: true, product: updated });
    }
  } catch (e) {}
  const index = localProducts.findIndex(p => p._id === id);
  if (index !== -1) {
    localProducts[index] = { ...localProducts[index], ...req.body };
    return res.json({ success: true, product: localProducts[index] });
  }
  res.status(404).json({ success: false, message: "Product not found" });
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      await Product.findByIdAndDelete(id);
    }
  } catch (e) {}
  localProducts = localProducts.filter(p => p._id !== id);
  res.json({ success: true, message: "Product deleted" });
});

// --- ORDER ROUTES ---

// 1. Customer Order History
app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const rawEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
    let userOrders = [];

    if (mongoose.connection.readyState === 1) {
      const escapedEmail = rawEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      userOrders = await Order.find({ 
        customerEmail: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } 
      }).sort({ createdAt: -1 });
    } else {
      userOrders = localOrders.filter(
        o => (o.customerEmail || '').trim().toLowerCase() === rawEmail
      );
    }

    res.json({ success: true, orders: userOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. All Orders (Admin)
app.get('/api/orders', async (req, res) => {
  try {
    let dbOrders = [];
    if (mongoose.connection.readyState === 1) {
      dbOrders = await Order.find().sort({ createdAt: -1 });
    }
    const combined = [...dbOrders, ...localOrders];
    const uniqueOrders = Array.from(new Map(combined.map(o => [String(o._id), o])).values());
    
    return res.json({ success: true, orders: uniqueOrders });
  } catch (e) {
    return res.json({ success: true, orders: localOrders });
  }
});

// 3. Create New Order (Sends Customer Receipt Email)
app.post('/api/orders', async (req, res) => {
  try {
    const cleanCustomerEmail = (req.body.customerEmail || '').trim().toLowerCase();
    const orderPayload = {
      ...req.body,
      customerEmail: cleanCustomerEmail,
      status: req.body.status || 'Pending'
    };

    let savedOrder = null;
    if (mongoose.connection.readyState === 1) {
      const o = new Order(orderPayload);
      savedOrder = await o.save();
    }

    const finalOrder = savedOrder ? savedOrder.toObject() : { ...orderPayload, _id: 'ord_' + Date.now() };
    localOrders.unshift(finalOrder);

    // Send itemized confirmation email
    sendOrderConfirmationEmail(finalOrder);

    res.json({ success: true, order: finalOrder });
  } catch (err) {
    console.error('[Create Order Error]:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update Order Status (Sends Status Notification Email)
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let targetOrder = null;

  try {
    if (mongoose.connection.readyState === 1) {
      targetOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    }
  } catch (e) {}

  if (!targetOrder) {
    const ord = localOrders.find(o => o._id === id);
    if (ord) {
      ord.status = status;
      targetOrder = ord;
    }
  }

  // Send status update notification email
  if (targetOrder && targetOrder.customerEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await transporter.sendMail({
        from: `"Teena's Secret" <${process.env.EMAIL_USER}>`,
        to: targetOrder.customerEmail,
        subject: `Order Status Update: ${status} (#${String(targetOrder._id).slice(-6).toUpperCase()})`,
        html: `
          <div style="background-color: #0b0b0b; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; border-radius: 12px; max-width: 550px; margin: auto; border: 1px solid #222;">
            <h2 style="color: #f59e0b; margin-top: 0;">Order Status Updated</h2>
            <p style="color: #ccc; font-size: 13px;">Your order has been marked as: <strong style="color: #10b981; font-size: 14px;">${status}</strong></p>
            <p style="color: #aaa; font-size: 12px;">Order ID: ${targetOrder._id}</p>
            <p style="color: #888; font-size: 11px; margin-top: 20px;">Teena's Secret Beauty Store</p>
          </div>
        `
      });
    } catch (e) {}
  }

  res.json({ success: true, message: "Status updated", order: targetOrder });
});

// Railway requires binding to 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running continuously on port ${PORT}`);
  mongoose.connect(MONGO_URI, { 
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4 // Force IPv4 to bypass SRV DNS timeouts on cloud containers
  })
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((err) => console.log('MongoDB Connection Failed:', err.message));
});