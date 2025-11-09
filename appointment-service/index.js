const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const axios = require('axios');

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
    // Step 1: Check patient exists
    const patientResp = await axios.get(`http://localhost:3004/patients/${patientId}`);
    if (!patientResp.data || patientResp.status !== 200) {
      return res.status(400).json({ error: 'Patient does not exist' });
    }

    // Step 2: Check doctor exists
    const doctorResp = await axios.get(`http://localhost:3003/doctors/${doctorId}`);
    if (!doctorResp.data || doctorResp.status !== 200) {
      return res.status(400).json({ error: 'Doctor does not exist' });
    }

    // Check department match
    if (doctorResp.data.department !== department) {
      return res.status(400).json({ error: 'Doctor department does not match appointment department' });
    }

    // Step 2b: Check doctor availability for the slot
    const slotCheck = await pool.query(
      `SELECT * FROM appointments WHERE doctor_id = $1 AND (
        (slot_start, slot_end) OVERLAPS ($2::timestamp, $3::timestamp)
      ) AND status = 'SCHEDULED'`,
      [doctorId, slotStart, slotEnd]
    );
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Doctor not available for this slot' });
    }

    // Step 3: Create Appointment
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, department, slot_start, slot_end, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patientId, doctorId, department, slotStart, slotEnd, status || 'SCHEDULED']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Appointment creation failed:', err.message);
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

app.post('/appointments/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { newSlotStart, newSlotEnd } = req.body;

  try {
    // Fetch appointment
    const result = await pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appointment = result.rows[0];

    // Rule 1: Max 2 reschedules
    if ((appointment.reschedule_count || 0) >= 2) {
      return res.status(400).json({ error: 'Max reschedules reached' });
    }

    // Rule 2: Cut-off within 1 hour of slot start
    const now = new Date();
    const slotStart = new Date(appointment.slot_start);
    console.log(slotStart);
    console.log(appointment.slot_start);
    
    
    if ((slotStart - now) < 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Cannot reschedule within 1 hour of slot start' });
    }

    // Check doctor availability and department (as before)
    // ...doctor service call...

    // Update appointment: new slot, increment reschedule_count
    const update = await pool.query(
      `UPDATE appointments
       SET slot_start = $1, slot_end = $2, reschedule_count = COALESCE(reschedule_count, 0) + 1, status = 'SCHEDULED'
       WHERE appointment_id = $3
       RETURNING *`,
      [newSlotStart, newSlotEnd, id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not reschedule appointment' });
  }
});

app.post('/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch appointment
    const result = await pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appointment = result.rows[0];

    // Check cancellation policy
    const now = new Date();
    const slotStart = new Date(appointment.slot_start);
    let refundType = 'full';
    let cancellationFee = 0;

    // Fetch bill for this appointment
    const billResp = await axios.get(`http://localhost:3002/bills?appointment_id=${id}`);
    const bill = billResp.data && billResp.data.length > 0 ? billResp.data[0] : null;

    if (!bill) {
      return res.status(404).json({ error: 'Associated bill not found' });
    }

    // Policy logic
    if ((slotStart - now) <= 2 * 60 * 60 * 1000) {
      refundType = 'partial';
      cancellationFee = bill.amount * 0.5; // 50% fee
      // Update bill with cancellation fee
      await axios.put(`http://localhost:3002/bills/${bill.bill_id}`, {
        ...bill,
        amount: cancellationFee,
        status: 'CANCELLED'
      });
    } else {
      // Full refund: mark bill as VOID
      await axios.put(`http://localhost:3002/bills/${bill.bill_id}`, {
        ...bill,
        status: 'VOID'
      });
    }

    // Set appointment status to CANCELLED
    await pool.query(
      `UPDATE appointments SET status = 'CANCELLED' WHERE appointment_id = $1`,
      [id]
    );

    res.json({
      success: true,
      appointment_id: id,
      refundType,
      cancellationFee
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel appointment' });
  }
});

//no-show endpoint
app.post('/appointments/:id/no-show', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch appointment
    const result = await pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appointment = result.rows[0];

    // Enforce 15-minute grace period
    const now = new Date();
    const slotStart = new Date(appointment.slot_start);
    if (now < new Date(slotStart.getTime() + 15 * 60 * 1000)) {
      return res.status(400).json({ error: 'Grace period not over. Cannot mark as no-show yet.' });
    }

    // Set appointment status to NO_SHOW
    await pool.query(
      `UPDATE appointments SET status = 'NO_SHOW' WHERE appointment_id = $1`,
      [id]
    );

    // Fetch bill for this appointment
    const billResp = await axios.get(`http://localhost:3002/bills?appointment_id=${id}`);
    const bill = billResp.data && billResp.data.length > 0 ? billResp.data[0] : null;

    if (!bill) {
      return res.status(404).json({ error: 'Associated bill not found' });
    }

    // Apply no-show fee (100% consultation fee)
    await axios.put(`http://localhost:3002/bills/${bill.bill_id}`, {
      ...bill,
      amount: bill.amount, // 100% fee
      status: 'CHARGED'
    });

    res.json({
      success: true,
      appointment_id: id,
      status: 'NO_SHOW',
      noShowFee: bill.amount
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not mark appointment as no-show' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});