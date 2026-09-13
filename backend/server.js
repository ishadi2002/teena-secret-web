import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Railway එකෙන් දෙන PORT එක හෝ නැත්නම් 5000 පාවිච්චි කිරීමට සැලැස්වීම
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://teena_admin:Teena12345i@cluster.wci1ahb.mongodb.net/teena_store?retryWrites=true&w=majority&appName=Cluster";
const JWT_SECRET = process.env.JWT_SECRET || "teena_secret_jwt_key_2025";

// Official PayHere Sandbox Credentials
const MERCHANT_ID = "1237984";
const MERCHANT_SECRET = "MzQyMjM1OTM2NjEyODkyMTExMjkzNDQwNDk5NDAzMTc1MDUzMDc3";

// Nodemailer Transporter Setup (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

setInterval(() => {}, 1 << 30);

// Root Route (ބ්‍රව්සර් එකෙන් ලින්ක් එක ඕපන් කළ විට 502 එරර් එක නොදී වැඩ කිරීමට)
app.get('/', (req, res) => {
  res.json({ success: true, message: "Teena's Secret Backend is Running Successfully!" });
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

// User Schema & Model (Added Reset Password fields)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' },
  phone: String,
  address: String,
  city: String,
  postalCode: String,
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
  customerEmail: String,
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

// --- AUTH & OTHER ROUTES ---
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

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id || 'local', role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
      phone, 
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

    const token = jwt.sign({ email: cleanEmail, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name, email: cleanEmail, role: 'customer' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- FORGOT & RESET PASSWORD ROUTES ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email: cleanEmail }).maxTimeMS(5000);
      } catch (e) {}
    }
    if (!user) {
      user = localUsers.find(u => u.email === cleanEmail);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    if (user.save && typeof user.save === 'function') {
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
    } else {
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    }

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      from: 'Teena\'s Secret <' + process.env.EMAIL_USER + '>',
      to: user.email,
      subject: 'Password Reset Request - Teena\'s Secret',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d4af37;">Teena's Secret Beauty Store</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>This link is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({
          resetPasswordToken,
          resetPasswordExpires: { $gt: Date.now() }
        }).maxTimeMS(5000);
      } catch (e) {}
    }
    if (!user) {
      user = localUsers.find(u => u.resetPasswordToken === resetPasswordToken && u.resetPasswordExpires > Date.now());
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    if (user.save && typeof user.save === 'function') {
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// --- ORDER ROUTES & EMAIL CONFIRMATION ---
app.get('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    }
  } catch (e) {}
  res.json({ success: true, orders: localOrders });
});

app.post('/api/orders', async (req, res) => {
  const newOrd = { ...req.body, _id: 'ord_' + Date.now(), status: 'Pending' };
  try {
    if (mongoose.connection.readyState === 1) {
      const o = new Order({ ...req.body, status: 'Pending' });
      await o.save();
      return res.json({ success: true, order: o });
    }
  } catch (e) {}
  localOrders.unshift(newOrd);
  res.json({ success: true, order: newOrd });
});

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

  const upperStatus = status ? status.toUpperCase() : '';
  if (targetOrder && (upperStatus.includes('CONFIRM') || upperStatus.includes('COMPLETE'))) {
    const customerEmail = targetOrder.customerEmail;
    const customerName = targetOrder.customerName || 'Customer';
    const orderId = targetOrder._id;
    const paymentMethod = targetOrder.paymentMethod || 'COD';
    const address = targetOrder.customerAddress || 'N/A';
    const phone = targetOrder.customerPhone || 'N/A';
    const totalAmount = targetOrder.totalAmount || 0;

    let itemsHtml = '';
    if (targetOrder.items && targetOrder.items.length > 0) {
      targetOrder.items.forEach(item => {
        itemsHtml += `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${item.name || item.productName}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; color: #555;">x${item.quantity || item.qty}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #333;">Rs. ${item.price * (item.quantity || item.qty)}</td>
          </tr>
        `;
      });
    }

    if (customerEmail) {
      const mailOptions = {
        from: 'Teena\'s Secret <' + process.env.EMAIL_USER + '>',
        to: customerEmail,
        subject: 'Your Order is Confirmed!',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h2 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 1px;">TEENA'S SECRET</h2>
                <p style="color: #777; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Glow up with confidence</p>
              </div>
              <h3 style="color: #2e7d32; font-size: 18px; margin-bottom: 10px;">Your Order is Confirmed!</h3>
              <p style="color: #444; font-size: 14px; line-height: 1.5;">Dear <b>${customerName}</b>,</p>
              <p style="color: #444; font-size: 14px; line-height: 1.5;">Thank you for choosing Teena's Secret. Your order has been officially verified and is now prepared for express courier delivery.</p>
              <div style="background: #f4f4f4; padding: 15px 20px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #333; line-height: 1.6;">
                <p style="margin: 4px 0;"><b>Order ID:</b> <span style="color: #b8860b;">${orderId}</span></p>
                <p style="margin: 4px 0;"><b>Payment Method:</b> ${paymentMethod}</p>
                <p style="margin: 4px 0;"><b>Delivery Address:</b> ${address}</p>
                <p style="margin: 4px 0;"><b>Phone:</b> ${phone}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                <thead>
                  <tr style="border-bottom: 2px solid #ddd; text-align: left; color: #555;">
                    <th style="padding-bottom: 8px;">Product</th>
                    <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="text-align: right; margin-top: 20px; border-top: 2px solid #eee; padding-top: 15px;">
                <p style="font-size: 15px; color: #333; margin: 0;">Total Net Payable: <b style="color: #b8860b; font-size: 18px; margin-left: 10px;">Rs. ${totalAmount}</b></p>
              </div>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Confirmation email sent:', info.response);
        }
      });
    }
  }

  res.json({ success: true, message: "Status updated", order: targetOrder });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running continuously on port ${PORT}`);
  mongoose.connect(MONGO_URI, { 
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((err) => console.log('MongoDB Connection Failed:', err.message));
});