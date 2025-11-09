// billing-service/index.js

const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Billing Service running!'));

// Get all bills
app.get('/bills', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bills');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bill by ID
app.get('/bills/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bills WHERE bill_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Billing Service running on port ${PORT}`);
});