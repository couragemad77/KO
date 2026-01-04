
/**
 * KNOCKOUT BIOMETRIC ADMS BRIDGE
 * ZKTeco F22 – T&A PUSH – Firebase
 * MASTER SYNC: DAILY-AWARE STATE TOGGLE (LOGIN/LOGOUT)
 */

const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = 80;

app.use(express.text({ type: () => true, limit: '10mb' }));

// ================= FIREBASE INITIALIZATION =================
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://knockout-7d62d-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

let lastDevicePing = null;

console.log(`
===============================================
 KNOCKOUT MASTER BRIDGE - ACTIVE
 LOGGING: [LOGS], [INFORMAL_LOGS], [VISITOR_LOGS]
 PORT: ${PORT}
===============================================
`);

// ================= ADMS / ICLOCK HANDLERS =================

app.get('/iclock/cdata', (req, res) => {
  lastDevicePing = Date.now();
  res.type('text/plain').send('GET OPTION FROM: SERVER\nC:ATTLOG');
});

app.post('/iclock/cdata', async (req, res) => {
  const table = req.query.table;
  if (table !== 'ATTLOG') return res.send('OK');

  const lines = (req.body || '').trim().split('\n').filter(Boolean);

  for (const line of lines) {
    const parts = line.split('\t');
    const devicePin = parts[0]; 
    const statusKey = parts[2] || "0"; 
    const now = Date.now();
    
    // Start of today for Harare/Local context
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    try {
      // 1. Resolve Employee
      const empSnap = await db.collection('employees').where('pin', '==', devicePin).limit(1).get();
      
      if (empSnap.empty) {
        console.log(`[WARN] PIN ${devicePin} not registered.`);
        continue;
      }

      const empDoc = empSnap.docs[0];
      const empData = empDoc.data();
      const employeeId = empDoc.id;

      // 2. STATE LOGIC: Check last activity TODAY
      const lastLogSnap = await db.collection('logs')
        .where('subjectId', '==', employeeId)
        .where('timestamp', '>=', startOfToday.getTime())
        .orderBy('timestamp', 'desc')
        .limit(1).get();

      let action = 'LOGIN'; // Default to login if first scan of day
      if (!lastLogSnap.empty) {
        const lastAction = lastLogSnap.docs[0].data().action;
        // If they were logged in, now they are logging out.
        action = (lastAction === 'LOGIN') ? 'LOGOUT' : 'LOGIN';
      }

      // 3. OVERRIDE: Hardware Status Keys
      // If user manually pressed "Break Out" (4) or "Break In" (5) on the device
      let finalCollection = 'logs';
      if (statusKey === "4" || statusKey === "5") {
        finalCollection = 'informal_logs';
        action = (statusKey === "4") ? 'GATE_OUT' : 'GATE_IN';
      }

      // 4. PERSISTENCE
      if (finalCollection === 'informal_logs') {
        if (action === 'GATE_OUT') {
          await db.collection('informal_logs').add({
            employeeId: employeeId,
            employeeName: empData.name,
            timeOut: now,
            timeIn: null,
            date: new Date().toLocaleDateString('en-GB')
          });
        } else {
          const openPass = await db.collection('informal_logs')
            .where('employeeId', '==', employeeId)
            .where('timeIn', '==', null)
            .orderBy('timeOut', 'desc').limit(1).get();
          
          if (!openPass.empty) {
            const doc = openPass.docs[0];
            const diff = now - doc.data().timeOut;
            const duration = `${Math.floor(diff/3600000)}h ${Math.floor((diff%3600000)/60000)}m`;
            await doc.ref.update({ timeIn: now, duration });
          }
        }
      } else {
        // Attendance Log
        await db.collection('logs').add({
          subjectId: employeeId,
          subjectName: empData.name,
          timestamp: now,
          action: action,
          status: 'SUCCESS',
          type: 'EMPLOYEE',
          source: 'F22_HARDWARE',
          date: new Date().toLocaleDateString('en-GB')
        });

        // Lifetime stats: Only increment on first LOGIN of the day
        if (action === 'LOGIN' && lastLogSnap.empty) {
          await empDoc.ref.update({ 
            totalDaysWorked: admin.firestore.FieldValue.increment(1) 
          });
        }
      }

      // 5. REAL-TIME UI UPDATE
      // Ensure 'name' and 'subjectName' are both sent to cover all frontend expectations
      await rtdb.ref('live_scans/latest').set({
        subjectId: employeeId,
        subjectName: empData.name,
        name: empData.name,
        action: action,
        timestamp: now
      });

      console.log(`✔ [SYNC] ${action}: ${empData.name} (${devicePin})`);

    } catch (err) {
      console.error('[SYNC ERROR]', err.message);
    }
  }
  res.send('OK');
});

app.get('/iclock/getrequest', (req, res) => res.type('text/plain').send('OK'));
app.post('/iclock/registry', (req, res) => res.send('OK'));
app.post('/iclock/devicecmd', (req, res) => res.send('OK'));
app.use((req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ ADMS Bridge listening on port ${PORT}`);
});
