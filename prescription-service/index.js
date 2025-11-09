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

// CREATE Prescription
app.post('/prescriptions', async (req, res) => {
  const { appointment_id, patient_id, doctor_id, medication, dosage, days } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medication, dosage, days)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [appointment_id, patient_id, doctor_id, medication, dosage, days]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not create prescription' });
  }
});

// UPDATE Prescription
app.put('/prescriptions/:id', async (req, res) => {
  const { appointment_id, patient_id, doctor_id, medication, dosage, days } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE prescriptions SET appointment_id=$1, patient_id=$2, doctor_id=$3, medication=$4, dosage=$5, days=$6
       WHERE prescription_id = $7 RETURNING *`,
      [appointment_id, patient_id, doctor_id, medication, dosage, days, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Prescription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update prescription' });
  }
});

// DELETE Prescription
app.delete('/prescriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete prescription' });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Prescription Service running on port ${PORT}`);
});