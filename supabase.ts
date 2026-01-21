
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dohhmfiwvfpqersihjbm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaGhtZml3dmZwcWVyc2loamJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjUwODgsImV4cCI6MjA4NDYwMTA4OH0.NUAJnrlRrpTtUZdiLs6sgbn0RHfEZ4V3FnR7QxblI4M";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Utilitário para garantir que o ID seja enviado no formato correto (número ou string)
 */
const parseId = (id: any) => {
  if (id === null || id === undefined) return id;
  const strId = String(id).trim();
  if (strId === "") return null;
  const num = Number(strId);
  if (!isNaN(num) && !strId.includes("-") && strId !== "") return num;
  return strId;
};

const TABLE_MAP: Record<string, string> = {
  'students': 'students',
  'employees': 'employees',
  'courses': 'courses',
  'classes': 'classes',
  'psychoanalysts': 'psychoanalysts',
  'patients': 'patients',
  'users': 'users',
  'class_students': 'class_students'
};

const FIELD_MAP: Record<string, string> = {
  id: 'id',
  name: 'name',
  email: 'email',
  role: 'role',
  phone: 'phone',
  enrolledAt: 'enrolled_at',
  courseId: 'course_id',
  specialty: 'specialty',
  birthDate: 'birth_date',
  familyIncome: 'family_income',
  socialValue: 'social_value',
  analystId: 'analyst_id',
  clinicalNotes: 'clinical_notes',
  username: 'username',
  password: 'password',
  department: 'department'
};

const INV_MAP = Object.entries(FIELD_MAP).reduce((acc, [js, db]) => ({ ...acc, [db]: js }), {} as any);

const toDB = (obj: any) => {
  if (!obj) return obj;
  const out: any = {};
  for (const k in obj) {
    if (k === 'studentIds' || k === 'patientIds' || k === 'patientId') continue;
    
    let val = obj[k];
    
    // Tratamento crucial: converter strings vazias em null para evitar erros de tipo no banco
    if (typeof val === 'string' && val.trim() === "") {
      val = null;
    }
    
    // Forçar IDs de referência e valores numéricos
    if ((k === 'analystId' || k === 'courseId' || k === 'socialValue') && val !== null) {
      val = (k === 'socialValue') ? Number(val) : parseId(val);
    }

    out[FIELD_MAP[k] || k] = val;
  }
  return out;
};

const fromDB = (obj: any) => {
  if (!obj) return obj;
  const out: any = {};
  for (const k in obj) out[INV_MAP[k] || k] = obj[k];
  return out;
};

export const db = {
  async getAll(tableKey: string) {
    if (!supabase) throw new Error("Supabase não configurado.");
    const tableName = TABLE_MAP[tableKey] || tableKey;
    const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromDB);
  },

  async getById(tableKey: string, id: string) {
    if (!supabase) throw new Error("Supabase não configurado.");
    const tableName = TABLE_MAP[tableKey] || tableKey;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', parseId(id))
      .maybeSingle();
    if (error) throw error;
    return data ? fromDB(data) : null;
  },

  async insert(tableKey: string, obj: any) {
    if (!supabase) throw new Error("Supabase não configurado.");
    const tableName = TABLE_MAP[tableKey] || tableKey;
    const dbObj = toDB(obj);
    const { data, error } = await supabase.from(tableName).insert([dbObj]).select();
    if (error) throw error;
    return fromDB(data[0]);
  },

  async update(tableKey: string, id: string, obj: any) {
    if (!supabase) throw new Error("Supabase não configurado.");
    const tableName = TABLE_MAP[tableKey] || tableKey;
    const { data, error } = await supabase.from(tableName).update(toDB(obj)).eq('id', parseId(id)).select();
    if (error) throw error;
    return fromDB(data[0]);
  },

  async delete(tableKey: string, id: string) {
    if (!supabase) throw new Error("Supabase indisponível.");
    const tableName = TABLE_MAP[tableKey] || tableKey;
    const targetId = parseId(id);

    const { error, count } = await supabase
      .from(tableName)
      .delete({ count: 'exact' })
      .eq('id', targetId);

    if (error) {
      if (error.code === '23503') {
        throw new Error("Não é possível excluir: existem outros registros vinculados a este item.");
      }
      throw error;
    }
    return true;
  },

  async getClassStudents(classId: string) {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', parseId(classId));
      if (error) throw error;
      return data.map(item => item.student_id);
    } catch (e) { return []; }
  },

  async syncClassStudents(classId: string, studentIds: string[]) {
    if (!supabase) throw new Error("Supabase indisponível.");
    const tid = parseId(classId);
    await supabase.from('class_students').delete().eq('class_id', tid);
    if (studentIds && studentIds.length > 0) {
      const inserts = studentIds.map(sid => ({ class_id: tid, student_id: parseId(sid) }));
      const { error } = await supabase.from('class_students').insert(inserts);
      if (error) throw error;
    }
  }
};
