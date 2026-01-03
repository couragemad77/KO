
import { Employee, Visitor, AttendanceLog, LogStatus, VisitorReason, AttendanceAction } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  EMPLOYEES: 'facetrack_employees',
  VISITORS: 'facetrack_visitors',
  LOGS: 'facetrack_logs',
  REASONS: 'facetrack_reasons'
};

const getInitialReasons = (): VisitorReason[] => [
  { id: '1', text: 'Business Meeting' },
  { id: '2', text: 'Interview' },
  { id: '3', text: 'Package Delivery' },
  { id: '4', text: 'Maintenance' },
  { id: '5', text: 'Personal Visit' }
];

// Added missing 'pin', 'fingerprintHash', and 'qrCodeData' properties to comply with Employee interface
const getInitialEmployees = (): Employee[] => [
  { id: '1', name: 'Alex Thompson', email: 'alex.t@company.com', department: 'Engineering', pin: '1111', fingerprintHash: 'BIO-F100001', qrCodeData: 'QR-001', createdAt: Date.now() },
  { id: '2', name: 'Sarah Miller', email: 'sarah.m@company.com', department: 'Design', pin: '2222', fingerprintHash: 'BIO-F200002', qrCodeData: 'QR-002', createdAt: Date.now() },
  { id: '3', name: 'David Chen', email: 'david.c@company.com', department: 'Product', pin: '3333', fingerprintHash: 'BIO-F300003', qrCodeData: 'QR-003', createdAt: Date.now() }
];

export const mockService = {
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(getInitialEmployees()));
      return getInitialEmployees();
    }
    return JSON.parse(data);
  },

  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>): Employee => {
    const employees = mockService.getEmployees();
    const newEmployee = {
      ...employee,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([...employees, newEmployee]));
    return newEmployee;
  },

  getVisitorReasons: (): VisitorReason[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REASONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.REASONS, JSON.stringify(getInitialReasons()));
      return getInitialReasons();
    }
    return JSON.parse(data);
  },

  addVisitorReason: (text: string) => {
    const reasons = mockService.getVisitorReasons();
    const newReason = { id: Date.now().toString(), text };
    localStorage.setItem(STORAGE_KEYS.REASONS, JSON.stringify([...reasons, newReason]));
    return newReason;
  },

  deleteVisitorReason: (id: string) => {
    const reasons = mockService.getVisitorReasons();
    localStorage.setItem(STORAGE_KEYS.REASONS, JSON.stringify(reasons.filter(r => r.id !== id)));
  },

  getLogs: (): AttendanceLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (log: Omit<AttendanceLog, 'id'>) => {
    const logs = mockService.getLogs();
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs]));
    return newLog;
  },

  verifyFace: async (base64Image: string): Promise<{ success: boolean; employee?: Employee; confidence?: number; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Logic: In a real app, we'd send base64Image to Compreface
    // For this demo, we'll "randomly" recognize one of our existing employees to show the success state
    const employees = mockService.getEmployees();
    const isSuccess = Math.random() > 0.3; // 70% success rate for demo

    if (isSuccess && employees.length > 0) {
      const luckyEmployee = employees[Math.floor(Math.random() * employees.length)];
      const confidence = 0.85 + Math.random() * 0.14; // Between 85% and 99%
      
      // Added missing 'action' property
      mockService.addLog({
        subjectId: luckyEmployee.id,
        subjectName: luckyEmployee.name,
        timestamp: Date.now(),
        status: LogStatus.SUCCESS,
        action: AttendanceAction.LOGIN,
        confidence,
        type: 'EMPLOYEE'
      });

      return { success: true, employee: luckyEmployee, confidence };
    } else {
      // Added missing 'action' property
      mockService.addLog({
        subjectId: 'unknown',
        subjectName: 'Unknown Person',
        timestamp: Date.now(),
        status: LogStatus.FAILED,
        action: AttendanceAction.LOGIN,
        confidence: 0,
        type: 'EMPLOYEE'
      });
      return { success: false, error: "No match found with required confidence." };
    }
  },

  logVisitor: (name: string, reason: string): Visitor => {
    const visitors = mockService.getLogs();
    
    // Fix: Split provided name into firstName and lastName to satisfy the Visitor interface
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Fix: Added missing 'identityType' and 'identityNumber' to satisfy Visitor interface
    const newVisitor: Visitor = {
      id: Date.now().toString(),
      firstName,
      lastName,
      reason,
      identityType: 'ZIM_ID',
      identityNumber: `MOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: Date.now()
    };
    
    // Added missing 'action' property
    mockService.addLog({
      subjectId: newVisitor.id,
      subjectName: name,
      timestamp: Date.now(),
      status: LogStatus.SUCCESS,
      action: AttendanceAction.LOGIN,
      confidence: 1,
      type: 'VISITOR'
    });

    return newVisitor;
  }
};
