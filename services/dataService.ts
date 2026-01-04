
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "../backend/firebase";
import { Employee, AttendanceLog, LogStatus, AttendanceAction, SystemSettings, Notice, AttendanceSession, Department, InformalLog } from "../types";

const EMPLOYEES_COL = "employees";
const LOGS_COL = "logs";
const VISITOR_LOGS_COL = "visitor_logs";
const INFORMAL_LOGS_COL = "informal_logs";
const SETTINGS_DOC = "config/system";
const NOTICES_COL = "notices";
const DEPARTMENTS_COL = "departments";

/**
 * Normalizes timestamps from various sources (seconds, milliseconds, Firestore, strings)
 * into a standard JS millisecond number.
 */
const normalizeTs = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts < 1e12 ? ts * 1000 : ts;
  if (typeof ts === 'string') return new Date(ts).getTime();
  if (ts?.seconds) return ts.seconds * 1000;
  return 0;
};

export const dataService = {
  subscribeToLiveScans: (callback: (log: any) => void) => {
    const scanRef = ref(rtdb, 'live_scans/latest');
    return onValue(scanRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Date.now() - normalizeTs(data.timestamp) < 15000) { 
        callback({
          ...data,
          subjectName: data.subjectName || data.name || "Personnel Identified"
        });
      }
    });
  },

  getHarareTime: async (): Promise<Date> => {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Harare');
      if (!response.ok) throw new Error("API Unreachable");
      const data = await response.json();
      return new Date(data.datetime);
    } catch (e) {
      return new Date();
    }
  },

  getNotices: async (): Promise<Notice[]> => {
    const q = query(collection(db, NOTICES_COL), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
  },

  getEmployees: async (): Promise<Employee[]> => {
    const q = query(collection(db, EMPLOYEES_COL), orderBy("name"));
    const snapshot = await getDocs(q);
    const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    console.log(`[DATA_SERVICE] Fetched ${emps.length} employees.`);
    return emps;
  },

  buildSessions: (logs: AttendanceLog[], employees: Employee[]): AttendanceSession[] => {
    console.log(`[SESSION_BUILDER] Processing ${logs.length} logs for ${employees.length} employees.`);
    const empMap = employees.reduce((acc, e) => ({ ...acc, [e.id]: e.department }), {} as Record<string, string>);
    
    // Filter for success and sort chronologically after normalization
    const sortedLogs = [...logs]
      .filter(l => l.status === LogStatus.SUCCESS)
      .sort((a, b) => normalizeTs(a.timestamp) - normalizeTs(b.timestamp));
      
    const sessionsBySubject: Record<string, AttendanceSession[]> = {};

    sortedLogs.forEach(log => {
      const ts = normalizeTs(log.timestamp);
      const dateKey = new Date(ts).toLocaleDateString('en-GB');
      const subjectId = String(log.subjectId).trim();
      
      if (!sessionsBySubject[subjectId]) {
        sessionsBySubject[subjectId] = [];
      }

      const userSessions = sessionsBySubject[subjectId];

      if (log.action === AttendanceAction.LOGIN) {
        userSessions.push({
          subjectId: subjectId,
          name: log.subjectName,
          date: dateKey,
          timeIn: new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }),
          timeOut: 'ONSITE',
          department: empMap[log.subjectId] || 'External',
          type: log.type || (subjectId.startsWith('visitor') ? 'VISITOR' : 'EMPLOYEE')
        });
      } else if (log.action === AttendanceAction.LOGOUT) {
        // Try to find the latest ONSITE session for this user on the same day
        const activeSession = userSessions.slice().reverse().find(s => s.timeOut === 'ONSITE' && s.date === dateKey);
        if (activeSession) {
          activeSession.timeOut = new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' });
        } else {
          // If no matching login found (orphan logout), create a partial session
          userSessions.push({
            subjectId: subjectId,
            name: log.subjectName,
            date: dateKey,
            timeIn: '---',
            timeOut: new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }),
            department: empMap[log.subjectId] || 'External',
            type: log.type || (subjectId.startsWith('visitor') ? 'VISITOR' : 'EMPLOYEE')
          });
        }
      }
    });

    const flat = Object.values(sessionsBySubject).flat();
    console.log(`[SESSION_BUILDER] Construction complete: ${flat.length} sessions.`);
    return flat.sort((a, b) => {
      const [dA, mA, yA] = a.date.split('/').map(Number);
      const [dB, mB, yB] = b.date.split('/').map(Number);
      const dateA = new Date(yA, mA - 1, dA).getTime();
      const dateB = new Date(yB, mB - 1, dB).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.timeIn.localeCompare(a.timeIn);
    });
  },

  getAttendanceSessions: async (logsInput?: AttendanceLog[]): Promise<AttendanceSession[]> => {
    let logs = logsInput;
    if (!logs) {
      const [empLogsSnap, visLogsSnap] = await Promise.all([
        getDocs(query(collection(db, LOGS_COL), orderBy("timestamp", "desc"), limit(2000))),
        getDocs(query(collection(db, VISITOR_LOGS_COL), orderBy("timestamp", "desc"), limit(1000)))
      ]);
      logs = [
        ...empLogsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceLog)),
        ...visLogsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceLog))
      ];
    }
    const employees = await dataService.getEmployees();
    return dataService.buildSessions(logs, employees);
  },

  addLog: async (log: Omit<AttendanceLog, 'id'>): Promise<void> => {
    const coll = log.type === 'VISITOR' ? VISITOR_LOGS_COL : LOGS_COL;
    await addDoc(collection(db, coll), log);
  },

  getLogs: async (max: number = 2000): Promise<AttendanceLog[]> => {
    const q = query(collection(db, LOGS_COL), orderBy("timestamp", "desc"), limit(max));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
    console.log(`[DATA_SERVICE] Fetched ${logs.length} staff logs.`);
    return logs;
  },

  getVisitorLogs: async (max: number = 1000): Promise<AttendanceLog[]> => {
    const q = query(collection(db, VISITOR_LOGS_COL), orderBy("timestamp", "desc"), limit(max));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
    console.log(`[DATA_SERVICE] Fetched ${logs.length} visitor logs.`);
    return logs;
  },

  getInformalLogs: async (): Promise<InformalLog[]> => {
    const q = query(collection(db, INFORMAL_LOGS_COL), orderBy("timeOut", "desc"));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InformalLog));
    console.log(`[DATA_SERVICE] Fetched ${logs.length} gate pass logs.`);
    return logs;
  },

  getUserLastAction: async (subjectId: string): Promise<AttendanceAction | null> => {
    const q = query(
      collection(db, LOGS_COL), 
      where("subjectId", "==", String(subjectId).trim()), 
      where("status", "==", LogStatus.SUCCESS),
      orderBy("timestamp", "desc"), 
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return (snap.docs[0].data() as AttendanceLog).action;
  },

  getActiveVisitors: async (): Promise<{id: string, name: string}[]> => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const q = query(
      collection(db, VISITOR_LOGS_COL),
      where("timestamp", ">=", today.getTime()),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(q);
    const activeMap = new Map<string, string>();
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.action === AttendanceAction.LOGIN) {
        activeMap.set(String(data.subjectId).trim(), data.subjectName);
      } else if (data.action === AttendanceAction.LOGOUT) {
        activeMap.delete(String(data.subjectId).trim());
      }
    });
    return Array.from(activeMap.entries()).map(([id, name]) => ({ id, name }));
  },

  processInformalLog: async (employee: Employee): Promise<{ success: boolean; duration?: string; action?: AttendanceAction; error?: string }> => {
    // Check if the user is currently clocked in to the main building
    const lastMainAction = await dataService.getUserLastAction(employee.id);
    if (lastMainAction !== AttendanceAction.LOGIN) {
      console.warn(`[GATE_PASS] Access Denied for ${employee.name}: Not Clocked In.`);
      return { success: false, error: "ACCESS DENIED: Staff must Clock-In first." };
    }

    const todayStr = new Date().toLocaleDateString('en-GB');
    const q = query(
      collection(db, INFORMAL_LOGS_COL),
      where("employeeId", "==", String(employee.id).trim()),
      where("date", "==", todayStr),
      where("timeIn", "==", null),
      limit(1)
    );
    const snap = await getDocs(q);
    const now = Date.now();

    if (snap.empty) {
      // Create a new departure record
      await addDoc(collection(db, INFORMAL_LOGS_COL), {
        employeeId: String(employee.id).trim(),
        employeeName: employee.name,
        timeOut: now,
        timeIn: null,
        date: todayStr
      });
      console.log(`[GATE_PASS] Departure recorded for ${employee.name}`);
      return { success: true, action: AttendanceAction.GATE_OUT };
    } else {
      // User is returning from an errand
      const logDoc = snap.docs[0];
      const data = logDoc.data();
      const diffMs = now - normalizeTs(data.timeOut);
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const durationStr = `${hours}h ${minutes}m`;
      await updateDoc(doc(db, INFORMAL_LOGS_COL, logDoc.id), {
        timeIn: now,
        duration: durationStr
      });
      console.log(`[GATE_PASS] Return recorded for ${employee.name} (Duration: ${durationStr})`);
      return { success: true, duration: durationStr, action: AttendanceAction.GATE_IN };
    }
  },

  processVerification: async (employee: Employee, action: AttendanceAction, confidence: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const now = Date.now();
      await dataService.addLog({
        subjectId: String(employee.id).trim(),
        subjectName: employee.name,
        timestamp: now,
        status: LogStatus.SUCCESS,
        action: action,
        confidence: confidence,
        type: 'EMPLOYEE'
      });
      console.log(`[ATTENDANCE] ${action} successful for ${employee.name}`);
      return { success: true };
    } catch (e: any) {
      console.error(`[ATTENDANCE] Error processing ${action} for ${employee.name}:`, e);
      return { success: false, error: e.message };
    }
  },

  setOutsideWork: async (assignments: { employeeId: string; days: number }[]): Promise<void> => {
    const batch = writeBatch(db);
    const now = Date.now();
    for (const { employeeId, days } of assignments) {
      const until = now + (days * 24 * 60 * 60 * 1000);
      batch.update(doc(db, EMPLOYEES_COL, String(employeeId).trim()), { outsideWorkUntil: until });
    }
    await batch.commit();
  },

  recallEmployeeFromOutsideWork: async (employeeId: string): Promise<void> => {
    await updateDoc(doc(db, EMPLOYEES_COL, String(employeeId).trim()), { outsideWorkUntil: null });
  },

  extendOutsideWork: async (employeeId: string, days: number): Promise<void> => {
    const empRef = doc(db, EMPLOYEES_COL, String(employeeId).trim());
    const snap = await getDoc(empRef);
    if (snap.exists()) {
      const currentUntil = normalizeTs(snap.data().outsideWorkUntil) || Date.now();
      const newUntil = currentUntil + (days * 24 * 60 * 60 * 1000);
      await updateDoc(empRef, { outsideWorkUntil: newUntil });
    }
  },

  getSettings: async (): Promise<SystemSettings> => {
    const docRef = doc(db, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as SystemSettings;
    return {
      lateThreshold: "09:00",
      earlyThreshold: "08:00",
      dayStart: "06:00",
      dayEnd: "18:00",
      outsideLogin: "07:00",
      outsideLogout: "17:00",
      companyMotto: "Excellence",
      companyContact: "Support",
      adminPassword: "admin"
    };
  },

  updateSettings: async (settings: SystemSettings) => {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
  },

  addNotice: async (notice: Omit<Notice, 'id'>): Promise<Notice> => {
    const docRef = await addDoc(collection(db, NOTICES_COL), { ...notice, updatedAt: Date.now() });
    return { id: docRef.id, ...notice } as Notice;
  },

  updateNotice: async (id: string, updated: Partial<Notice>): Promise<void> => {
    await updateDoc(doc(db, NOTICES_COL, id), { ...updated, updatedAt: Date.now() });
  },

  deleteNotice: async (notice: Notice): Promise<void> => {
    if (notice.id) await deleteDoc(doc(db, NOTICES_COL, notice.id));
  },

  updateEmployee: async (id: string, employee: Partial<Employee>): Promise<void> => {
    await setDoc(doc(db, EMPLOYEES_COL, String(id).trim()), employee, { merge: true });
  },

  addEmployee: async (employee: Omit<Employee, 'id' | 'createdAt' | 'qrCodeData'>): Promise<Employee> => {
    const qrCodeData = `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newEmp = { ...employee, qrCodeData, createdAt: Date.now(), totalDaysWorked: 0 };
    const docRef = await addDoc(collection(db, EMPLOYEES_COL), newEmp);
    return { id: docRef.id, ...newEmp } as Employee;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, EMPLOYEES_COL, String(id).trim()));
  },

  getDepartments: async (): Promise<Department[]> => {
    const q = query(collection(db, DEPARTMENTS_COL), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  addDepartment: async (name: string): Promise<Department> => {
    const docRef = await addDoc(collection(db, DEPARTMENTS_COL), { name });
    return { id: docRef.id, name };
  },

  updateDepartment: async (id: string, name: string): Promise<void> => {
    await updateDoc(doc(db, DEPARTMENTS_COL, id), { name });
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, DEPARTMENTS_COL, id));
  },

  wipeLogs: async (): Promise<void> => {
    const batch = writeBatch(db);
    const logsSnap = await getDocs(query(collection(db, LOGS_COL)));
    const gateSnap = await getDocs(query(collection(db, INFORMAL_LOGS_COL)));
    const visSnap = await getDocs(query(collection(db, VISITOR_LOGS_COL)));
    logsSnap.docs.forEach(d => batch.delete(d.ref));
    gateSnap.docs.forEach(d => batch.delete(d.ref));
    visSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
};
