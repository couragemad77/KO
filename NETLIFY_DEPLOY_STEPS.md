
# Netlify + Local Hardware Deployment

To use your physical F22 with a cloud-hosted Netlify app, follow these steps:

## 1. Deploy the Frontend to Netlify
1.  Zip all your files (excluding `node_modules`).
2.  Go to [Netlify Drop](https://app.netlify.com/drop).
3.  Drag and drop your zip.
4.  Your app is now live at `yoursite.netlify.app`.

## 2. Keep the Local Bridge Running
Your Netlify app cannot "see" your LAN. You **must** keep your PC running the bridge server:
1.  Connect PC to Ethernet (F22) and WiFi (Internet).
2.  PC IP: `192.168.137.1`.
3.  F22 Gateway/Server IP: `192.168.137.1`.
4.  Run: `node local-biometric-server.js` on the PC.

## 3. The Registration Workflow
1.  **Open Netlify**: Access your admin dashboard on your phone or PC via the Netlify URL.
2.  **Add Employee**: Create "John Doe" with PIN `123`.
3.  **Click Enroll**: This writes a command to Firebase.
4.  **The Bridge**: Your local PC sees the Firebase command and tells the F22 (via Ethernet) to start scanning.
5.  **The F22**: Beeps and captures John Doe's finger.
6.  **Real-time Scan**: When John Doe scans his finger later, the Local PC sends the log to Firebase, and the Netlify Home Screen shows the success modal instantly.

## 4. Troubleshooting
- **F22 not connecting?** Disable Windows Firewall on your PC for Port 80.
- **Logs not showing on Netlify?** Check your `serviceAccountKey.json` on the PC bridge. It must be for the same Firebase project used in your Netlify app's `firebase.ts`.
