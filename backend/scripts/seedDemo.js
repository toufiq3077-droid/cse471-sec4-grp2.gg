require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Crop = require('../models/Crop');

const seed = async () => {
  try {
    await connectDB();

    // Remove existing demo entries (safe pattern: emails/names with demo tag)
    await User.deleteMany({ email: /demo@kheti|demo\.(farmer|buyer)@kheti/ });
    await Crop.deleteMany({ name: /Demo/ });

    const farmer = await User.create({
      role: 'farmer',
      name: 'Demo Farmer',
      email: 'demo.farmer@kheti.local',
      password: 'password123',
      phone: '0123456789',
      farmName: 'Demo Farm',
    });

    const buyer = await User.create({
      role: 'buyer',
      name: 'Demo Buyer',
      email: 'demo.buyer@kheti.local',
      password: 'password123',
      phone: '0198765432',
    });

    const crops = [
      {
        farmer: farmer._id,
        name: 'Demo Potato',
        category: 'Vegetable',
        description: 'High-quality demo potatoes',
        stockQuantity: 100,
        unit: 'kg',
        season: 'All Season',
        pricePerUnit: 20,
        discountPercent: 0,
        images: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            publicId: 'demo/sample',
          },
        ],
      },
      {
        farmer: farmer._id,
        name: 'Demo Mango',
        category: 'Fruit',
        description: 'Sweet demo mangoes',
        stockQuantity: 50,
        unit: 'kg',
        season: 'Summer',
        pricePerUnit: 100,
        discountPercent: 5,
        images: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
            publicId: 'demo/sample2',
          },
        ],
      },
    ];

    await Crop.insertMany(crops);

    console.log('Demo seed complete.');
    console.log('Farmer login -> email: demo.farmer@kheti.local | password: password123');
    console.log('Buyer  login -> email: demo.buyer@kheti.local  | password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
