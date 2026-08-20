const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vocal_quest_db');
    console.log('MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    console.error('MongoDB Connection Error: ' + error.message);
    process.exit(1);
  }
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL Cloud Database');
});

connectDB.pool = pool;
connectDB.connectDB = connectDB;

module.exports = connectDB;
