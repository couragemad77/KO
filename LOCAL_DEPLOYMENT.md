
# Local Setup: Web App + Biometric Bridge

Follow these steps to run the system on your local machine using the **192.168.137.x** network.

## 1. Network Preparation (The PC)
Your PC is the server. It must have the IP `192.168.137.1`.
- Go to Network Settings -> Ethernet Adapter -> IPv4 Properties.
- Set IP: `192.168.137.1`
- Subnet: `255.255.255.0`
- Gateway: Leave blank or set to your router.

## 2. Configure the F22 Hardware
Access the F22 Menu (M/OK):
- **Comm. Settings -> IP Address**: `192.168.137.10`
- **Comm. Settings -> Subnet Mask**: `255.255.255.0`
- **Comm. Settings -> Gateway**: `192.168.137.1`
- **Comm. Settings -> Cloud Server Setting**:
  - Server Address: `192.168.137.1`
  - Server Port: `80`
  - HTTPS: `OFF`

## 3. Run the Bridge Server
1. Open terminal in the project folder.
2. Ensure `serviceAccountKey.json` (from Firebase) is present.
3. Run: `npm install express firebase-admin`
4. Run: `node local-biometric-server.js` (Run as Administrator).

## 4. Run the Web App
1. Open another terminal in the project folder.
2. Run: `npx serve .`
3. Open `http://localhost:3000` in your browser.

## 5. Testing the Flow
1. **Enrollment**:
   - Go to Admin -> Employee List.
   - Create an employee with PIN `101`.
   - Edit the employee and click **Initiate Remote Enrollment**.
   - Watch the Bridge Server console; it will send the command.
   - The F22 will beep and say "Please press finger".
2. **Attendance**:
   - Scan the registered finger on the F22.
   - The Bridge Server will log: `[SUCCESS] Name marked LOGIN`.
   - The Web App Home Screen will immediately show the Success notification.
