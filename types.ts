
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  VISITOR = 'VISITOR',
  ADMIN = 'ADMIN'
}

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export enum AttendanceAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  GATE_OUT = 'GATE_OUT',
  GATE_IN = 'GATE_IN'
}

export interface VisitorReason {
  id: string;
  text: string;
}

export interface Notice {
  id?: string;
  content: string;
  isActive: boolean;
  updatedAt: number;
  icon?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface SystemSettings {
  lateThreshold: string;
  earlyThreshold: string;
  dayStart: string;
  dayEnd: string;
  outsideLogin: string;
  outsideLogout: string;
  companyMotto: string;
  companyContact: string;
  adminPassword?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  pin: string;
  fingerprintHash: string;
  qrCodeData: string;
  imageId?: string; 
  createdAt: number;
  outsideWorkUntil?: number | null;
}

export interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  reason: string;
  identityType: 'ZIM_ID' | 'PASSPORT';
  identityNumber: string;
  timestamp: number;
  photoBase64?: string;
}

export interface AttendanceLog {
  id: string;
  subjectId: string;
  subjectName: string;
  timestamp: number;
  status: LogStatus;
  action: AttendanceAction;
  confidence: number;
  type: 'EMPLOYEE' | 'VISITOR';
  category?: 'EARLY' | 'LATE' | 'ON-TIME';
  isOutsideWork?: boolean;
}

export interface InformalLog {
  id: string;
  employeeId: string;
  employeeName: string;
  timeOut: number;
  timeIn?: number;
  duration?: string;
  date: string;
}

export interface AttendanceSession {
  subjectId: string;
  name: string;
  date: string;
  timeIn: string;
  timeOut: string;
  department?: string;
  type: 'EMPLOYEE' | 'VISITOR';
}
