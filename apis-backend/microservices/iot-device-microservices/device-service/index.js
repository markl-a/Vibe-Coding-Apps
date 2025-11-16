const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_devices';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Devices)'))
  .catch(err => console.error('❌ MongoDB error:', err));

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['sensor', 'actuator', 'gateway', 'monitor'] },
  manufacturer: { type: String },
  model: { type: String },
  firmwareVersion: { type: String },
  status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  metadata: { type: Map, of: String },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', deviceSchema);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Device Service' });
});

// Register device
app.post('/api/devices', [
  body('deviceId').notEmpty(),
  body('name').notEmpty(),
  body('type').isIn(['sensor', 'actuator', 'gateway', 'monitor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const device = new Device(req.body);
    await device.save();
    res.status(201).json({ message: 'Device registered', device });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Device ID already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const devices = await Device.find(query).limit(100);
    res.json({ devices, total: devices.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get device by ID
app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ device });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update device
app.put('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'Device updated', device });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update device status
app.put('/api/devices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      { status, lastSeen: Date.now(), updatedAt: Date.now() },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'Status updated', device });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete device
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Device Service running on port ${PORT}`);
});
