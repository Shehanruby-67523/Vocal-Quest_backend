const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db.js');

const authRoutes = require('./src/routes/authRoutes.js');
const userRoutes = require('./src/routes/userRoutes.js');
const gameRoutes = require('./src/routes/gameRoutes.js');
const questRoutes = require('./src/routes/questRoutes.js');
const adminRoutes = require('./src/routes/adminRoutes.js');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Base Route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Vocal Quest Backend API'
  });
});

// Welcome / Health check route
app.get('/', (req, res) => {
  res.json({ message: "Vocal Quest API is running successfully!" });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));