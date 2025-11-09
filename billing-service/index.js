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

// CREATE Bill
app.post('/bills', async (req, res) => {
  const { appointment_id, patient_id, amount, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO bills (appointment_id, patient_id, amount, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [appointment_id, patient_id, amount, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not create bill' });
  }
});

// UPDATE Bill
app.put('/bills/:id', async (req, res) => {
  const { appointment_id, patient_id, amount, status } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE bills SET appointment_id=$1, patient_id=$2, amount=$3, status=$4
       WHERE bill_id = $5 RETURNING *`,
      [appointment_id, patient_id, amount, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Bill not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update bill' });
  }
});

// DELETE Bill
app.delete('/bills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM bills WHERE bill_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete bill' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Billing Service running on port ${PORT}`);
});