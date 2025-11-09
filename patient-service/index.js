// patient-service/index.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => res.send('Patient Service running!'));

// Get all patients
app.get('/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get patient by ID
app.get('/patients/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE patient_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE Patient
app.post('/patients', async (req, res) => {
  const { name, email, phone, dob } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patients (name, email, phone, dob)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone, dob]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not create patient' });
  }
});

// UPDATE Patient
app.put('/patients/:id', async (req, res) => {
  const { name, email, phone, dob } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE patients SET name=$1, email=$2, phone=$3, dob=$4
       WHERE patient_id = $5 RETURNING *`,
      [name, email, phone, dob, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update patient' });
  }
});

// DELETE Patient
app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM patients WHERE patient_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete patient' });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});