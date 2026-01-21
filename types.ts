
export type UserRole = 'ADMIN' | 'USER';
export type EmployeeRole = 'Professor' | 'Secretaria' | 'Diretoria';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  password?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrolledAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  courseId: string;
  studentIds: string[];
}

export interface Psychoanalyst {
  id: string;
  name: string;
  specialty: string;
  patientIds: string[];
}

export interface Patient {
  id: string;
  name: string;
  birthDate?: string;
  familyIncome?: string;
  socialValue?: number | null;
  analystId: string | null;
  clinicalNotes: string;
}

export interface AppState {
  users: User[];
  students: Student[];
  employees: Employee[];
  courses: Course[];
  classes: ClassRoom[];
  psychoanalysts: Psychoanalyst[];
  patients: Patient[];
}
