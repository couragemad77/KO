
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
  writeBatch,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "../backend/firebase";
import { Employee, AttendanceLog, LogStatus, AttendanceAction, SystemSettings, Notice, AttendanceSession, Department, InformalLog } from "../types";

const EMPLOYEES_COL = "employees";
const LOGS_COL = "logs";
const INFORMAL_LOGS_COL = "informal_logs";
const SETTINGS_DOC = "config/system";
const NOTICES_COL = "notices";
const DEPARTMENTS_COL = "departments";

export const dataService = {
  // Real-time listener for the Home Screen
  subscribeToNewLogs: (callback: (log: AttendanceLog) => void) => {
    // Increased window to 60 seconds to handle server-client clock drift
    const q = query(
      collection(db, LOGS_COL),
      where("timestamp", ">", Date.now() - 60000), 
      orderBy("timestamp", "desc"),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback({ id: change.doc.id, ...change.doc.data() } as AttendanceLog);
        }
      });
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

  updateNotice: async (id: string, updated: Partial<Notice>): Promise<void> => {
    const docRef = doc(db, NOTICES_COL, id);
    await updateDoc(docRef, { ...updated, updatedAt: Date.now() });
  },

  deleteNotice: async (notice: Notice): Promise<void> => {
    if (notice.id) {
      await deleteDoc(doc(db, NOTICES_COL, notice.id));
    }
  },

  addNotice: async (notice: Omit<Notice, 'id'>): Promise<Notice> => {
    const docRef = await addDoc(collection(db, NOTICES_COL), { 
      ...notice, 
      updatedAt: Date.now() 
    });
    return { id: docRef.id, ...notice } as Notice;
  },

  getSettings: async (): Promise<SystemSettings> => {
    const docRef = doc(db, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    const defaultSettings: SystemSettings = {
      lateThreshold: "09:00",
      earlyThreshold: "08:00",
      dayStart: "06:00",
      dayEnd: "18:00",
      outsideLogin: "07:00",
      outsideLogout: "17:00",
      companyMotto: "Excellence in Service",
      companyContact: "+1 (555) 000-1234 | info@company.com",
      adminPassword: "admin123"
    };

    if (snap.exists()) {
      return { ...defaultSettings, ...snap.data() } as SystemSettings;
    }
    return defaultSettings;
  },

  updateSettings: async (settings: SystemSettings) => {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
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
    const docRef = doc(db, DEPARTMENTS_COL, id);
    await updateDoc(docRef, { name });
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, DEPARTMENTS_COL, id));
  },

  getEmployees: async (): Promise<Employee[]> => {
    const q = query(collection(db, EMPLOYEES_COL), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  },

  addEmployee: async (employee: Omit<Employee, 'id' | 'createdAt' | 'qrCodeData'>): Promise<Employee> => {
    const qrCodeData = `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newEmp = { ...employee, qrCodeData, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, EMPLOYEES_COL), newEmp);
    return { id: docRef.id, ...newEmp } as Employee;
  },

  updateEmployee: async (id: string, employee: Partial<Employee>): Promise<void> => {
    const docRef = doc(db, EMPLOYEES_COL, id);
    await setDoc(docRef, employee, { merge: true });
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, EMPLOYEES_COL, id));
  },

  setOutsideWork: async (assignments: { employeeId: string, days: number }[]): Promise<void> => {
    const settings = await dataService.getSettings();
    const batch = writeBatch(db);
    const employees = await dataService.getEmployees();
    
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const [loginH, loginM] = settings.outsideLogin.split(':').map(Number);
    const [logoutH, logoutM] = settings.outsideLogout.split(':').map(Number);

    for (const { employeeId, days } of assignments) {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) continue;

      const expiration = Date.now() + (days * 24 * 60 * 60 * 1000);
      const empRef = doc(db, EMPLOYEES_COL, employee.id);
      batch.update(empRef, { outsideWorkUntil: expiration });

      for (let i = 0; i < days; i++) {
        const targetDate = new Date(startOfToday);
        targetDate.setDate(targetDate.getDate() + i);

        const logInTime = new Date(targetDate);
        logInTime.setHours(loginH || 7, loginM || 0, 0, 0);
        
        const loginRef = doc(collection(db, LOGS_COL));
        batch.set(loginRef, {
          subjectId: employee.id,
          subjectName: employee.name,
          timestamp: logInTime.getTime(),
          status: LogStatus.SUCCESS,
          action: AttendanceAction.LOGIN,
          confidence: 1.0,
          type: 'EMPLOYEE',
          category: 'ON-TIME',
          isOutsideWork: true
        });

        const logOutTime = new Date(targetDate);
        logOutTime.setHours(logoutH || 17, logoutM || 0, 0, 0);
        
        const logoutRef = doc(collection(db, LOGS_COL));
        batch.set(logoutRef, {
          subjectId: employee.id,
          subjectName: employee.name,
          timestamp: logOutTime.getTime(),
          status: LogStatus.SUCCESS,
          action: AttendanceAction.LOGOUT,
          confidence: 1.0,
          type: 'EMPLOYEE',
          category: 'ON-TIME',
          isOutsideWork: true
        });
      }
    }
    await batch.commit();
  },

  recallEmployeeFromOutsideWork: async (employeeId: string): Promise<void> => {
    const docRef = doc(db, EMPLOYEES_COL, employeeId);
    await updateDoc(docRef, { outsideWorkUntil: null });
  },

  extendOutsideWork: async (employeeId: string, days: number): Promise<void> => {
    const empRef = doc(db, EMPLOYEES_COL, employeeId);
    const empSnap = await getDoc(empRef);
    if (!empSnap.exists()) return;
    
    const data = empSnap.data();
    const currentUntil = data.outsideWorkUntil || Date.now();
    const newUntil = currentUntil + (days * 24 * 60 * 60 * 1000);
    
    await updateDoc(empRef, { outsideWorkUntil: newUntil });

    const settings = await dataService.getSettings();
    const batch = writeBatch(db);
    const [loginH, loginM] = settings.outsideLogin.split(':').map(Number);
    const [logoutH, logoutM] = settings.outsideLogout.split(':').map(Number);

    const startFrom = new Date(currentUntil);
    startFrom.setHours(0,0,0,0);

    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(startFrom);
      targetDate.setDate(targetDate.getDate() + i);

      const logInTime = new Date(targetDate);
      logInTime.setHours(loginH || 7, loginM || 0, 0, 0);
      
      const loginRef = doc(collection(db, LOGS_COL));
      batch.set(loginRef, {
        subjectId: employeeId,
        subjectName: data.name,
        timestamp: logInTime.getTime(),
        status: LogStatus.SUCCESS,
        action: AttendanceAction.LOGIN,
        confidence: 1.0,
        type: 'EMPLOYEE',
        category: 'ON-TIME',
        isOutsideWork: true
      });

      const logOutTime = new Date(targetDate);
      logOutTime.setHours(logoutH || 17, logoutM || 0, 0, 0);
      
      const logoutRef = doc(collection(db, LOGS_COL));
      batch.set(logoutRef, {
        subjectId: employeeId,
        subjectName: data.name,
        timestamp: logOutTime.getTime(),
        status: LogStatus.SUCCESS,
        action: AttendanceAction.LOGOUT,
        confidence: 1.0,
        type: 'EMPLOYEE',
        category: 'ON-TIME',
        isOutsideWork: true
      });
    }
    await batch.commit();
  },

  wipeLogs: async (): Promise<void> => {
    const batch = writeBatch(db);
    const logsSnap = await getDocs(query(collection(db, LOGS_COL)));
    logsSnap.docs.forEach(d => batch.delete(d.ref));
    const gateSnap = await getDocs(query(collection(db, INFORMAL_LOGS_COL)));
    gateSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  getAttendanceSessions: async (logsInput?: AttendanceLog[]): Promise<AttendanceSession[]> => {
    const logs = logsInput || await dataService.getLogs(2000);
    const employees = await dataService.getEmployees();
    const empMap = employees.reduce((acc, e) => ({ ...acc, [e.id]: e.department }), {} as Record<string, string>);
    
    const sortedLogs = [...logs]
      .filter(l => l.status === LogStatus.SUCCESS)
      .sort((a, b) => a.timestamp - b.timestamp);
      
    const sessionsBySubject: Record<string, AttendanceSession[]> = {};

    sortedLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toLocaleDateString('en-GB');
      if (!sessionsBySubject[log.subjectId]) {
        sessionsBySubject[log.subjectId] = [];
      }

      const userSessions = sessionsBySubject[log.subjectId];

      if (log.action === AttendanceAction.LOGIN) {
        userSessions.push({
          subjectId: log.subjectId,
          name: log.subjectName,
          date: dateKey,
          timeIn: new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }),
          timeOut: 'ONSITE',
          department: empMap[log.subjectId] || 'Visitor',
          type: log.type
        });
      } else if (log.action === AttendanceAction.LOGOUT) {
        const activeSession = userSessions.slice().reverse().find(s => s.timeOut === 'ONSITE');
        if (activeSession) {
          activeSession.timeOut = new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' });
        }
      }
    });

    const allSessions = Object.values(sessionsBySubject).flat();
    return allSessions.sort((a, b) => {
      const [dA, mA, yA] = a.date.split('/').map(Number);
      const [dB, mB, yB] = b.date.split('/').map(Number);
      const dateA = new Date(yA, mA - 1, dA).getTime();
      const dateB = new Date(yB, mB - 1, dB).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.timeIn.localeCompare(a.timeIn);
    });
  },

  getLogs: async (max: number = 2000): Promise<AttendanceLog[]> => {
    const q = query(collection(db, LOGS_COL), orderBy("timestamp", "desc"), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
  },

  addLog: async (log: Omit<AttendanceLog, 'id'>): Promise<void> => {
    await addDoc(collection(db, LOGS_COL), log);
  },

  getActiveVisitors: async (): Promise<{id: string, name: string}[]> => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const q = query(
      collection(db, LOGS_COL),
      where("type", "==", "VISITOR"),
      where("timestamp", ">=", today.getTime()),
      orderBy("timestamp", "asc")
    );
    
    const snap = await getDocs(q);
    const activeMap = new Map<string, string>();

    snap.docs.forEach(d => {
      const data = d.data();
      if (data.action === AttendanceAction.LOGIN) {
        activeMap.set(data.subjectId, data.subjectName);
      } else if (data.action === AttendanceAction.LOGOUT) {
        activeMap.delete(data.subjectId);
      }
    });

    return Array.from(activeMap.entries()).map(([id, name]) => ({ id, name }));
  },

  getUserLastAction: async (subjectId: string): Promise<AttendanceAction | null> => {
    const q = query(
      collection(db, LOGS_COL), 
      where("subjectId", "==", subjectId), 
      where("status", "==", LogStatus.SUCCESS),
      orderBy("timestamp", "desc"), 
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return (snap.docs[0].data() as AttendanceLog).action;
  },

  getInformalLogs: async (): Promise<InformalLog[]> => {
    const q = query(collection(db, INFORMAL_LOGS_COL), orderBy("timeOut", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InformalLog));
  },

  processInformalLog: async (employee: Employee): Promise<{ success: boolean; duration?: string; error?: string }> => {
    const lastMainAction = await dataService.getUserLastAction(employee.id);
    if (lastMainAction !== AttendanceAction.LOGIN) {
      return { success: false, error: "Access Denied: You must Clock In before using Gate Pass." };
    }

    const todayStr = new Date().toLocaleDateString('en-GB');
    const q = query(
      collection(db, INFORMAL_LOGS_COL),
      where("employeeId", "==", employee.id),
      where("date", "==", todayStr),
      where("timeIn", "==", null),
      limit(1)
    );
    const snap = await getDocs(q);
    const now = Date.now();

    if (snap.empty) {
      await addDoc(collection(db, INFORMAL_LOGS_COL), {
        employeeId: employee.id,
        employeeName: employee.name,
        timeOut: now,
        timeIn: null,
        date: todayStr
      });
      return { success: true };
    } else {
      const logDoc = snap.docs[0];
      const data = logDoc.data();
      const diffMs = now - data.timeOut;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const durationStr = `${hours}h ${minutes}m`;

      await updateDoc(doc(db, INFORMAL_LOGS_COL, logDoc.id), {
        timeIn: now,
        duration: durationStr
      });
      return { success: true, duration: durationStr };
    }
  },

  processVerification: async (employee: Employee, requestedAction: AttendanceAction, confidence: number): Promise<{ success: boolean; employee?: Employee; error?: string }> => {
    try {
      const now = Date.now();
      const settings = await dataService.getSettings();
      const category = dataService.categorizeTime(now, requestedAction, settings);

      await addDoc(collection(db, LOGS_COL), {
        subjectId: employee.id,
        subjectName: employee.name,
        timestamp: now,
        status: LogStatus.SUCCESS,
        action: requestedAction,
        confidence,
        type: 'EMPLOYEE',
        category
      });
      
      return { success: true, employee };
    } catch (e: any) {
      return { success: false, error: e.message || "Registry Conflict" };
    }
  },

  categorizeTime: (timestamp: number, action: AttendanceAction, settings: SystemSettings): 'EARLY' | 'LATE' | 'ON-TIME' => {
    if (action === AttendanceAction.LOGOUT) return 'ON-TIME';
    const date = new Date(timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    if (timeStr > settings.lateThreshold) return 'LATE';
    if (timeStr < settings.earlyThreshold) return 'EARLY';
    return 'ON-TIME';
  }
};
