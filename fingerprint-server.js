
/**
 * ZKTECO FINGERPRINT BRIDGE SERVER
 * --------------------------------
 * 1. Install Node.js
 * 2. Run: npm install express cors node-zk-fingerprint
 * 3. Run: node fingerprint-server.js
 */

const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Note: You must have the ZKTECO drivers and SDK installed on your OS.
// This requires the 'node-zk-fingerprint' package which links to the C++ SDK.
let zk = null;
try {
  const { ZKFP2 } = require('node-zk-fingerprint');
  zk = new ZKFP2();
} catch (e) {
  console.warn("Hardware library not found. Running in MOCK mode for development.");
}

app.get('/status', (req, res) => {
  if (!zk) return res.status(503).json({ status: 'offline', error: 'Driver not found' });
  res.json({ status: 'ready', device: 'ZKTECO USB Scanner' });
});

app.post('/scan', async (req, res) => {
  console.log("Fingerprint scan requested...");

  // If real hardware is missing, simulate a successful scan for testing
  if (!zk) {
    await new Promise(r => setTimeout(r, 2000)); // Simulate finger placement delay
    return res.json({ 
      template: `MOCK_ZK_TEMPLATE_${Math.random().toString(36).substr(2, 9)}`,
      msg: "MOCK DATA (No real hardware detected)" 
    });
  }

  try {
    // 1. Initialize device
    zk.Init();
    const deviceCount = zk.GetDeviceCount();
    if (deviceCount === 0) throw new Error("No device connected");

    zk.OpenDevice(0);
    
    // 2. Wait for finger (Blocking or polling depending on SDK version)
    // This is a simplified logic. Real implementation involves 
    // waiting for the AcquireFingerprint event.
    console.log("Waiting for finger...");
    const template = zk.AcquireFingerprint(); // This usually returns a Buffer/String

    zk.CloseDevice();
    zk.Terminate();

    if (!template) throw new Error("Failed to capture template. Please try again.");

    res.json({ template: template.toString('base64') });
  } catch (err) {
    console.error("Hardware Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Fingerprint Bridge running at http://localhost:${port}`);
  console.log(`Ready to receive requests from FaceTrack Pro frontend.`);
});
