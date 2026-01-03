
# ZKTEco F22 Local LAN Setup Guide

To connect your F22 device to the Knockout system without using the cloud, follow these steps.

## 1. Setup the Computer (The Server)
1. **Get your PC IP**: 
   - Open CMD, type `ipconfig`.
   - Find your **IPv4 Address** (e.g., `192.168.1.15`).
2. **Setup Folder**:
   - Create a folder `knockout-bridge`.
   - Copy `local-biometric-server.js` into it.
   - Download your **Service Account Key** from Firebase (Project Settings -> Service Accounts) and rename it to `serviceAccountKey.json`.
3. **Launch**:
   - Run `npm install express firebase-admin`.
   - Run `node local-biometric-server.js`.

## 2. Configure the F22 Device
On the F22 physical buttons:
1. **Network**:
   - IP: `192.168.1.201` (Or any free IP on your range).
   - Gateway: Your router IP.
2. **Cloud Server Setting**:
   - **Server Address**: Your PC IP (e.g., `192.168.1.15`).
   - **Server Port**: `80`.
   - **Enable Proxy**: Off.
   - **HTTPS**: Off.

## 3. How to Enroll Users
1. In the Web App, go to **Admin Dashboard** -> **Employee List**.
2. Click **Edit** on a user.
3. Click **Initiate Remote Enrollment**.
4. Within 30 seconds, the F22 device screen will wake up and say **"Please press finger"**.
5. Have the user scan their finger 3 times. 
6. The device will automatically save the data and sync it with the App.

## 4. Using Gate Pass
- On the F22, you can use the **Status Keys** (M/OK then select status).
- Status "Break Out" is mapped to **Gate Pass Exit**.
- Status "Break In" is mapped to **Gate Pass Return**.
