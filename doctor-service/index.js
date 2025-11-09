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

// CREATE Doctor
app.post('/doctors', async (req, res) => {
  const { name, email, phone, department, specialization } = req.body;
  const created_at = new Date();
  try {
    const result = await pool.query(
      `INSERT INTO doctors (name, email, phone, department, specialization, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, department, specialization, created_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Doctor creation failed:', err);
    res.status(500).json({ error: 'Could not create doctor' });
  }
});

// UPDATE Doctor
app.put('/doctors/:id', async (req, res) => {
  const { name, email, phone, department, specialization } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE doctors SET name=$1, email=$2, phone=$3, department=$4, specialization=$5
       WHERE doctor_id = $6 RETURNING *`,
      [name, email, phone, department, specialization, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Doctor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Could not update doctor' });
  }
});

// DELETE Doctor
app.delete('/doctors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM doctors WHERE doctor_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete doctor' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});