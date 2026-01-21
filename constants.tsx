
import React from 'react';
import { 
  Users, 
  UserSquare2, 
  GraduationCap, 
  BookOpen, 
  School, 
  Stethoscope, 
  Settings, 
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { AppState } from './types';

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'students', label: 'Alunos', icon: <GraduationCap size={20} /> },
  { id: 'employees', label: 'Funcionários', icon: <UserSquare2 size={20} /> },
  { id: 'courses', label: 'Cursos', icon: <BookOpen size={20} /> },
  { id: 'classes', label: 'Turmas', icon: <School size={20} /> },
  { id: 'clinic', label: 'Clínica Social', icon: <Stethoscope size={20} /> },
  { id: 'users', label: 'Usuários do Sistema', icon: <Settings size={20} />, adminOnly: true },
];

// Added explicit AppState type to ensure 'role' is treated as UserRole instead of string
export const INITIAL_STATE: AppState = {
  users: [
    { id: '1', username: 'admin', role: 'ADMIN', password: '123' }
  ],
  students: [],
  employees: [],
  courses: [],
  classes: [],
  psychoanalysts: [],
  patients: []
};
