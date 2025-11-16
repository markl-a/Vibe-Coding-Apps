const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN
});

const org = process.env.INFLUXDB_ORG || 'iot-org';
const bucket = process.env.INFLUXDB_BUCKET || 'device-data';
const writeApi = influxDB.getWriteApi(org, bucket);
const queryApi = influxDB.getQueryApi(org);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Data Service' });
});

// Write data
app.post('/api/data/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = req.body;

    const point = new Point('device_data')
      .tag('deviceId', deviceId)
      .timestamp(new Date(data.timestamp || Date.now()));

    // Add all numeric fields
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'number') {
        point.floatField(key, data[key]);
      }
    });

    writeApi.writePoint(point);
    await writeApi.flush();

    res.status(201).json({ message: 'Data recorded', deviceId });
  } catch (error) {
    console.error('Write error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Query data
app.get('/api/data/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start = '-1h', stop = 'now()' } = req.query;

    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r["deviceId"] == "${deviceId}")
    `;

    const data = [];
    await queryApi.collectRows(query, (row) => {
      data.push(row);
    });

    res.json({ deviceId, data, count: data.length });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest data
app.get('/api/data/:deviceId/latest', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["deviceId"] == "${deviceId}")
        |> last()
    `;

    const data = [];
    await queryApi.collectRows(query, (row) => {
      data.push(row);
    });

    res.json({ deviceId, latest: data[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Data Service running on port ${PORT}`);
});
