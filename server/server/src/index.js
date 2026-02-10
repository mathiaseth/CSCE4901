import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

import userRoutes from './routes/userRoutes.js';
import foodRoutes from './routes/foodRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/food', foodRoutes);

// Root endpoint
app.get('/', (req, res) => res.send('NutriFit API is running!'));

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
