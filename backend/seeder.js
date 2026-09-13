const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Product = require('./models/Product');

const mongoUri = process.env.MONGO_URI || "mongodb+srv://teena_admin:Teena12345@cluster.wci1ahb.mongodb.net/teena_secret_db?authSource=admin&retryWrites=true&w=majority&appName=Cluster";

const products = [
  {
    name: "Egg Protein Hair Shampoo & Conditioner Kit",
    slug: "egg-protein-hair-kit",
    category: "Hair Care",
    price: 3200,
    discountPrice: 2950,
    images: ["/images/egg-protein-hair.png"],
    description: "Protein solution for strong, smooth & shiny hair. Suitable for all hair types.",
    benefits: ["Hair fall control", "Deep scalp nourishment", "Silky smoothness"],
    isFeatured: true
  },
  {
    name: "Cloves Hair Growth Serum (50ml)",
    slug: "cloves-hair-growth-serum",
    category: "Hair Care",
    price: 1850,
    discountPrice: 1650,
    images: ["/images/cloves-serum.png"],
    description: "100% natural formula with cloves oil to unlock natural hair volume and regrowth.",
    benefits: ["Stimulates hair follicles", "Prevents dandruff", "Fast hair growth"],
    isFeatured: true
  },
  {
    name: "Teena's Secret Active Facial Serums",
    slug: "active-facial-serums",
    category: "Serums",
    price: 2100,
    discountPrice: 1950,
    images: ["/images/serums-collection.png"],
    description: "Multi-action serum variants: Hyaluronic Acid, 24K Gold, Vitamin C, and Alpha Arbutin.",
    benefits: ["Deep hydration", "Fades dark marks", "Instant glass skin glow"],
    isFeatured: true
  },
  {
    name: "Aloe Vera Soothing Gel 99%",
    slug: "aloe-vera-soothing-gel",
    category: "Skin Care",
    price: 1450,
    discountPrice: 0,
    images: ["/images/aloe-vera-gel.png"],
    description: "Deep moisturizing, oil-control, acne soothing and calming after-sun formula.",
    benefits: ["Reduces sunburn redness", "Oil-free hydration", "Soothes irritated skin"]
  },
  {
    name: "Turmeric Glowing Body & Face Cream",
    slug: "turmeric-glowing-body-cream",
    category: "Body Care",
    price: 2200,
    discountPrice: 1990,
    images: ["/images/turmeric-cream.png"],
    description: "Clear, brighten and glowing skin formula with pure turmeric active extracts.",
    benefits: ["Hyperpigmentation reduction", "Natural skin radiance", "Even skin tone"]
  },
  {
    name: "Shea Glowing Body Butter (250g)",
    slug: "shea-glowing-body-butter",
    category: "Body Care",
    price: 2400,
    discountPrice: 0,
    images: ["/images/shea-butter.png"],
    description: "Intensive moisturizing formula giving skin a healthy, velvety glow.",
    benefits: ["Repairs dry skin", "Restores elasticity", "Softens rough skin"]
  },
  {
    name: "Vitamin C Soothing Gel 99%",
    slug: "vitamin-c-soothing-gel",
    category: "Skin Care",
    price: 1550,
    discountPrice: 0,
    images: ["/images/vitamin-c-gel.png"],
    description: "Brightening and anti-aging antioxidant gel that leaves skin supple and refreshed.",
    benefits: ["Brightens dull complexion", "Boosts collagen", "Reduces fine spots"]
  },
  {
    name: "Coconut Moisturiser Butter (250g)",
    slug: "coconut-moisturiser-butter",
    category: "Body Care",
    price: 2300,
    discountPrice: 0,
    images: ["/images/coconut-butter.png"],
    description: "Rich organic coconut butter for lasting skin barrier protection and softness.",
    benefits: ["Deep moisturizing", "Non-sticky texture", "Natural tropical scent"]
  },
  {
    name: "Rose Facial Whipped Moisturiser",
    slug: "rose-facial-whipped-cream",
    category: "Skin Care",
    price: 1750,
    discountPrice: 0,
    images: ["/images/rose-cream.png"],
    description: "Whipped light facial cream infused with pure rose extracts for supple skin.",
    benefits: ["Gentle hydration", "Plumps skin texture", "Soothing aroma"]
  },
  {
    name: "Milk & Honey Creamy Body Wash (300ml)",
    slug: "milk-and-honey-body-wash",
    category: "Body Care",
    price: 1650,
    discountPrice: 0,
    images: ["/images/milk-honey-wash.png"],
    description: "Gentle lather body wash enriched with honey and milk protein for smooth skin.",
    benefits: ["Soft cleansing", "Moisture retention", "Silky finish"]
  },
  {
    name: "Rose Oil Smoothing Gel",
    slug: "rose-oil-smoothing-gel",
    category: "Skin Care",
    price: 1600,
    discountPrice: 0,
    images: ["/images/rose-oil-gel.png"],
    description: "Multipurpose cooling gel enriched with pure rose oil extracts.",
    benefits: ["Cools heated skin", "Hydrates dry patches", "Refreshes skin"]
  },
  {
    name: "Gold Facial Care Glow Kit",
    slug: "gold-facial-care-kit",
    category: "Facial Sets",
    price: 4500,
    discountPrice: 3990,
    images: ["/images/gold-kit.png"],
    description: "Complete salon-grade facial system: Cleanser, Scrub, Massage Cream, Toner, and Pack.",
    benefits: ["Deep detox cleansing", "Brightening facial treatment", "Youthful radiance"],
    isFeatured: true
  },
  {
    name: "Sakura Fairness Facial Care Set",
    slug: "sakura-fairness-facial-set",
    category: "Facial Sets",
    price: 4300,
    discountPrice: 3850,
    images: ["/images/sakura-set.png"],
    description: "Japanese Sakura blossom enriched complete glow facial set.",
    benefits: ["Even complexion", "Gentle exfoliation", "Skin tone balancing"],
    isFeatured: true
  }
];

const seedProducts = async () => {
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log("Teena's Secret Products Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Failed:", error.message);
    process.exit(1);
  }
};

seedProducts();
