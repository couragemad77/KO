
# Local Deployment Guide: Biometric System

This guide explains how to run the app on your local machine (`192.168.137.1`) and connect it to your physical ZKTeco F22 hardware.

## 1. Prerequisites
- **Node.js installed**: [Download here](https://nodejs.org/)
- **Firebase Service Account**:
  1. Go to your [Firebase Console](https://console.firebase.google.com/).
  2. Select your project -> **Project Settings** -> **Service Accounts**.
  3. Click **Generate New Private Key**.
  4. Rename the downloaded file to `serviceAccountKey.json`.
  5. Place it in the project root folder.

## 2. PC Network Setup
Your computer must be the static gateway for the device.
1. Open **Network & Internet Settings** -> **Ethernet** -> **IP Settings**.
2. Edit IP settings to **Manual**.
3. Set IPv4: `192.168.137.1`
4. Subnet Mask: `255.255.255.0`
5. Gateway: Leave blank (unless you have a router at `.1`).

## 3. F22 Device Configuration
Enter the F22 Menu (M/OK):
1. **Comm. Settings** -> **Ethernet**:
   - IP Address: `192.168.137.10`
   - Subnet Mask: `255.255.255.0`
   - Gateway: `192.168.137.1`
2. **Comm. Settings** -> **Cloud Server Setting**:
   - Server Address: `192.168.137.1`
   - Server Port: `80`
   - HTTPS: `OFF`

## 4. Launching the System

### A. Start the Bridge Server
Open a terminal (As Administrator) in the project folder:
```bash
npm install express firebase-admin
node local-biometric-server.js
```
*You should see: "✔ Firebase Cloud Connection: ACTIVE"*

### B. Start the Web App
Open another terminal:
```bash
npx serve .
```
*Open `http://localhost:3000` in your browser.*

## 5. Verification Checklist
1. **Register Employee**: In the Web App Admin, create a user with PIN `1001`.
2. **Remote Enroll**: Edit that user and click "Initiate Remote Enrollment". The F22 should beep and say "Please press finger".
3. **Scan Finger**: Scan the finger 3 times.
4. **Auth Test**: Scan the finger again. The Bridge Console will log `[SUCCESS]`, and the Web App Home Screen will show the Success Modal instantly.
