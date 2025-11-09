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

app.post('/appointments', async (req, res) => {
  const { patientId, doctorId, department, slotStart, slotEnd, status } = req.body;
  try {
    const result = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, department, slot_start, slot_end, status)
    VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [patientId, doctorId, department, slotStart, slotEnd, status || 'SCHEDULED']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Appointment creation failed:', err);
    res.status(500).json({ error: 'Could not create appointment' });
  }
});

app.put('/appointments/:id', async (req, res) => {
  const { patientId, doctorId, department, slotStart, slotEnd, status } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE appointments
       SET patient_id = $1, doctor_id = $2, department = $3, slot_start = $4, slot_end = $5, status = $6
       WHERE appointment_id = $7
       RETURNING *`,
      [patientId, doctorId, department, slotStart, slotEnd, status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Appointment update failed:', err);
    res.status(500).json({ error: 'Could not update appointment' });
  }
});

app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM appointments WHERE appointment_id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      res.json({ success: true, deleted: result.rows[0] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Could not delete appointment' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});