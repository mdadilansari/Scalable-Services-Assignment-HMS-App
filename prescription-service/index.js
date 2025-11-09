// prescription-service/index.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Prescription Service running!'));

// Get all prescriptions
app.get('/prescriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prescriptions');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get prescription by ID
app.get('/prescriptions/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prescriptions WHERE prescription_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Prescription Service running on port ${PORT}`);
});