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
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Root Route
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

// User Schema & Model
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