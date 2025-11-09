const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Appointment Service running!'));

// Get all appointments
app.get('/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/appointments/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});