// doctor-service/index.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Doctor Service running!'));

// Get all doctors
app.get('/doctors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get doctor by ID
app.get('/doctors/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors WHERE doctor_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});