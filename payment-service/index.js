// payment-service/index.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Payment Service running!'));

// Get all payments
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment by ID
app.get('/payments/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments WHERE payment_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE Payment
app.post('/payments', async (req, res) => {
  const { bill_id, amount, method, reference } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments (bill_id, amount, method, reference)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bill_id, amount, method, reference]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not create payment' });
  }
});

// UPDATE Payment
app.put('/payments/:id', async (req, res) => {
  const { bill_id, amount, method, reference } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE payments SET bill_id=$1, amount=$2, method=$3, reference=$4
       WHERE payment_id = $5 RETURNING *`,
      [bill_id, amount, method, reference, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update payment' });
  }
});

// DELETE Payment
app.delete('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM payments WHERE payment_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete payment' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});