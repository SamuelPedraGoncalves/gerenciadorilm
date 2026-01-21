import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import { 
  AppState, Student, Employee, Course, ClassRoom, 
  Psychoanalyst, Patient, User, UserRole, EmployeeRole 
} from './types';
import { INITIAL_STATE } from './constants';
import { 
  Plus, Search, Edit2, Trash2, UserPlus, GraduationCap, 
  Users as UsersIcon, BookOpen, School, Stethoscope, 
  BrainCircuit, UserCheck, ChevronRight, UserMinus, PlusCircle, AlertCircle, RefreshCw, XCircle, DollarSign, ChevronDown, ChevronUp, Loader2, Database, AlertTriangle, User as UserIcon, X
} from 'lucide-react';
import { generateCourseDescription } from './services/geminiService';
import { db, isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [expandedAnalystId, setExpandedAnalystId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{table: string, id: string, name: string, type: string} | null>(null);
  
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [u, s, e, c, cl, pa, p] = await Promise.all([
        db.getAll('users').catch(() => INITIAL_STATE.users),
        db.getAll('students').catch(() => []),
        db.getAll('employees').catch(() => []),
        db.getAll('courses').catch(() => []),
        db.getAll('classes').catch(() => []),
        db.getAll('psychoanalysts').catch(() => []),
        db.getAll('patients').catch(() => [])
      ]);

      const classesWithStudents = await Promise.all(cl.map(async (item: any) => {
        const studentIds = await db.getClassStudents(item.id);
        return { ...item, studentIds };
      }));

      setState({
        users: u,
        students: s,
        employees: e,
        courses: c,
        classes: classesWithStudents,
        psychoanalysts: pa,
        patients: p
      });
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => 
      u.username.toLowerCase() === loginData.username.trim().toLowerCase() && 
      u.password === loginData.password.trim()
    );
    if (user) { setIsLoggedIn(true); setCurrentUser(user); } 
    else { alert('Credenciais inválidas.'); }
  };

  const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any>(null);

  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const initiateDelete = async (table: string, id: string) => {
    setIsLoading(true);
    try {
      const item = await db.getById(table, id);
      if (item) {
        const typeLabels: any = {
          'students': 'aluno',
          'employees': 'funcionário',
          'courses': 'curso',
          'classes': 'turma',
          'psychoanalysts': 'psicanalista',
          'patients': 'paciente',
          'users': 'usuário'
        };
        setDeleteConfirm({
          table,
          id,
          name: item.name || item.username || item.id,
          type: typeLabels[table] || 'item'
        });
      } else {
        alert("O item não foi encontrado no banco de dados.");
        await fetchData();
      }
    } catch (e: any) {
      alert("Erro ao buscar registro: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { table, id } = deleteConfirm;
    setDeleteConfirm(null);
    setIsDeleting(id);
    
    try {
      await db.delete(table, id);
      setState(prev => {
        const currentList = (prev as any)[table] || [];
        return {
          ...prev,
          [table]: currentList.filter((item: any) => String(item.id) !== String(id))
        };
      });
      setTimeout(() => alert("✅ Registro excluído com sucesso!"), 100);
    } catch (e: any) {
      alert(`❌ FALHA NA EXCLUSÃO:\n\n${e.message}`);
      await fetchData();
    } finally {
      setIsDeleting(null);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tighter italic">Gerenciador ILM</h2>
          <p className="text-slate-500 font-medium text-sm">Controle Central Acadêmico e Clínico</p>
        </div>
        <button onClick={fetchData} className="p-2 px-5 bg-white border border-slate-200 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> SINCRONIZAR
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard icon={<GraduationCap className="text-blue-500" />} label="Alunos" count={state.students.length} color="bg-blue-50" />
        <DashboardCard icon={<UsersIcon className="text-purple-500" />} label="Funcionários" count={state.employees.length} color="bg-purple-50" />
        <DashboardCard icon={<BookOpen className="text-emerald-500" />} label="Cursos" count={state.courses.length} color="bg-emerald-50" />
        <DashboardCard icon={<School className="text-amber-500" />} label="Turmas" count={state.classes.length} color="bg-amber-50" />
      </div>
    </div>
  );

  const renderList = (title: string, data: any[], columns: { key: string, label: string }[], addType: string, editType: string, tableName: string, extraActions?: (item: any) => React.ReactNode) => {
    const displayColumns = [{ key: 'id', label: 'ID' }, ...columns];

    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <button onClick={() => openModal(addType)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all font-bold text-sm">
            <Plus size={18} /> Adicionar
          </button>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {displayColumns.map(col => (
                  <th key={col.key} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic text-sm">Nenhum registro encontrado em {tableName}.</td></tr>
              ) : data.map(item => (
                <React.Fragment key={item.id}>
                  <tr className={`hover:bg-slate-50/50 transition-colors ${expandedClassId === item.id ? 'bg-blue-50/20' : ''}`}>
                    {displayColumns.map(col => (
                      <td key={col.key} className="px-6 py-4 text-sm text-slate-700 font-semibold">
                        {col.key === 'id' ? (
                          <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-500 font-bold">#{item.id}</span>
                        ) : (
                          item[col.key] || '-'
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {extraActions && extraActions(item)}
                      <button onClick={() => openModal(editType, item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg hover:bg-white"><Edit2 size={16} /></button>
                      <button 
                        disabled={!!isDeleting} 
                        onClick={() => initiateDelete(tableName, String(item.id))} 
                        className="p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-white disabled:opacity-20"
                      >
                        {isDeleting === String(item.id) ? <Loader2 size={16} className="animate-spin text-red-600" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expandedClassId === item.id && tableName === 'classes' && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={displayColumns.length + 1} className="px-8 py-6">
                        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><UserIcon size={14}/> Alunos na Turma</h4>
                            <button onClick={() => openModal('manage_class_students', item)} className="text-[9px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-blue-700 transition-all uppercase shadow-md shadow-blue-200">Gerenciar</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.studentIds && item.studentIds.length > 0 ? (
                              item.studentIds.map((sid: string) => {
                                const student = state.students.find(s => String(s.id) === String(sid));
                                return (
                                  <div key={sid} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black text-slate-600 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                    {student?.name || "ID: " + sid}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-[10px] italic text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed w-full text-center">Nenhum aluno matriculado nesta turma.</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClinic = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight"><Stethoscope className="text-rose-500" /> Clínica Social ILM</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><BrainCircuit className="text-blue-500" size={16}/> Psicanalistas</h3>
            <button onClick={() => openModal('add_analyst')} className="text-blue-600 text-[10px] font-black uppercase hover:underline tracking-widest">+ Novo Profissional</button>
          </div>
          <div className="space-y-3">
            {state.psychoanalysts.map(ana => {
              const analystPatients = state.patients.filter(p => String(p.analystId) === String(ana.id));
              const isExpanded = expandedAnalystId === ana.id;
              
              return (
                <div key={ana.id} className="flex flex-col gap-1">
                  <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-start border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded font-bold">#{ana.id}</span>
                        <h4 className="font-bold text-sm text-slate-800">{ana.name}</h4>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{ana.specialty}</p>
                      
                      <button 
                        onClick={() => setExpandedAnalystId(isExpanded ? null : ana.id)}
                        className="mt-3 flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {analystPatients.length} Pacientes {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal('link_patient', ana)} className="p-2 text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100" title="Vincular Paciente"><UserPlus size={16}/></button>
                      <button onClick={() => openModal('edit_analyst', ana)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100"><Edit2 size={16}/></button>
                      <button onClick={() => initiateDelete('psychoanalysts', String(ana.id))} className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mx-4 mb-2 p-4 bg-white border-x border-b border-blue-50 rounded-b-2xl shadow-inner space-y-2 animate-in slide-in-from-top-2">
                      {analystPatients.length > 0 ? (
                        analystPatients.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group/item">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <span className="text-[11px] font-bold text-slate-700">{p.name}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">ID #{p.id}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl border border-dashed">Nenhum paciente vinculado no momento.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {state.psychoanalysts.length === 0 && <p className="text-[10px] text-center text-slate-400 py-6 italic">Nenhum psicanalista no sistema.</p>}
          </div>
        </section>
        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><UserIcon className="text-rose-500" size={16}/> Pacientes</h3>
            <button onClick={() => openModal('add_patient')} className="text-rose-600 text-[10px] font-black uppercase hover:underline tracking-widest">+ Novo Paciente</button>
          </div>
          <div className="space-y-3">
            {state.patients.map(pat => {
              const analyst = state.psychoanalysts.find(a => String(a.id) === String(pat.analystId));
              return (
                <div key={pat.id} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-transparent hover:border-rose-100 hover:bg-white transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded font-bold">#{pat.id}</span>
                      <h4 className="font-bold text-sm text-slate-800">{pat.name}</h4>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-[10px] font-medium text-slate-400">Analista: <span className={analyst ? 'text-blue-600 font-black' : 'italic'}>{analyst?.name || 'Aguardando vínculo'}</span></p>
                      {pat.socialValue !== null && pat.socialValue !== undefined && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          <DollarSign size={10}/> {Number(pat.socialValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal('edit_patient', pat)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-slate-100"><Edit2 size={16}/></button>
                    <button onClick={() => initiateDelete('patients', String(pat.id))} className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
            {state.patients.length === 0 && <p className="text-[10px] text-center text-slate-400 py-6 italic">Nenhum paciente cadastrado.</p>}
          </div>
        </section>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'students': return renderList('Base de Alunos', state.students, [{key: 'name', label: 'Nome'}, {key: 'email', label: 'E-mail'}], 'add_student', 'edit_student', 'students');
      case 'employees': return renderList('Corpo Docente e Staff', state.employees, [{key: 'name', label: 'Nome'}, {key: 'role', label: 'Cargo'}], 'add_employee', 'edit_employee', 'employees');
      case 'courses': return renderList('Cursos Ofertados', state.courses, [{key: 'name', label: 'Curso'}, {key: 'duration', label: 'Duração'}], 'add_course', 'edit_course', 'courses');
      case 'classes': return renderList('Turmas Ativas', state.classes, [{key: 'name', label: 'Identificador'}], 'add_class', 'edit_class', 'classes', (item) => (
        <button onClick={() => setExpandedClassId(expandedClassId === item.id ? null : item.id)} className={`p-2 rounded-lg transition-all ${expandedClassId === item.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600'}`}>
          {expandedClassId === item.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      ));
      case 'clinic': return renderClinic();
      case 'users': return renderList('Acessos do Sistema', state.users, [{key: 'username', label: 'Usuário'}, {key: 'role', label: 'Perfil'}], 'add_user', 'edit_user', 'users');
      default: return renderDashboard();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl space-y-10 animate-in zoom-in duration-500">
          <div className="text-center">
            <h1 className="text-6xl font-black text-blue-600 tracking-tighter italic select-none">ILM</h1>
            <p className="text-slate-400 text-[10px] mt-4 font-black uppercase tracking-[0.3em]">Portal de Administração</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <InputField label="Login" value={loginData.username} onChange={(v:string) => setLoginData({...loginData, username: v})} required />
            <InputField label="Senha" type="password" value={loginData.password} onChange={(v:string) => setLoginData({...loginData, password: v})} required />
            <button type="submit" className="w-full bg-blue-600 py-5 rounded-[1.5rem] text-white font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.96]">ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser!} onLogout={handleLogout} />
      <main className="flex-1 p-12 overflow-auto h-screen relative scroll-smooth text-slate-800">
        <div className="max-w-6xl mx-auto pb-24">
          {renderContent()}
        </div>
        
        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 max-w-md w-full space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-red-50 rounded-2xl text-red-600">
                  <AlertTriangle size={32} />
                </div>
                <button onClick={() => setDeleteConfirm(null)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Confirmação de Exclusão</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Você tem certeza que quer excluir o <span className="font-black text-slate-900">{deleteConfirm.type}</span>: <span className="font-black text-red-600 italic">"{deleteConfirm.name}"</span>?
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-3 rounded-xl border border-dashed text-center">
                  Esta ação é irreversível e afetará os dados no servidor.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Não, voltar
                </button>
                <button 
                  onClick={executeDelete} 
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Sim, excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleting && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[210] flex items-center justify-center animate-in fade-in">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-8 max-sm w-80">
              <div className="relative">
                <Loader2 className="animate-spin text-red-600 mx-auto" size={64}/>
                <Trash2 className="absolute inset-0 m-auto text-slate-200" size={24}/>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Processando...</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium italic">Sincronizando banco de dados.</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && !isDeleting && !deleteConfirm && (
          <div className="fixed bottom-10 right-10 bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 text-[10px] font-black text-slate-600 animate-in slide-in-from-right-10">
            <Loader2 className="animate-spin text-blue-600" size={16}/>
            VERIFICANDO DADOS
          </div>
        )}
      </main>
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? '✏️ EDITAR REGISTRO' : '✨ NOVO REGISTRO'}>
        <DynamicForm type={modalType} item={editingItem} state={state} fetchData={fetchData} closeModal={closeModal} />
      </Modal>
    </div>
  );
};

const DashboardCard = ({ icon, label, count, color }: any) => (
  <div className={`p-10 rounded-[2.5rem] border border-white shadow-sm ${color} transition-all hover:shadow-2xl hover:-translate-y-2 cursor-default group relative overflow-hidden`}>
    <div className="flex items-center justify-between mb-8 relative z-10">
      <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">{icon}</div>
      <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{count}</span>
    </div>
    <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.25em] relative z-10">{label}</h3>
    <div className="absolute -bottom-6 -right-6 text-white/10 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
       {React.cloneElement(icon, { size: 120 })}
    </div>
  </div>
);

const DynamicForm = ({ type, item, state, fetchData, closeModal }: any) => {
  const [formData, setFormData] = useState<any>(item || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const tableMap: any = {
      'add_student': 'students', 'edit_student': 'students',
      'add_employee': 'employees', 'edit_employee': 'employees',
      'add_course': 'courses', 'edit_course': 'courses',
      'add_class': 'classes', 'edit_class': 'classes',
      'add_analyst': 'psychoanalysts', 'edit_analyst': 'psychoanalysts',
      'add_patient': 'patients', 'edit_patient': 'patients',
      'add_user': 'users', 'edit_user': 'users'
    };
    const table = tableMap[type];
    try {
      if (item) {
        await db.update(table, item.id, formData);
      } else {
        await db.insert(table, formData);
      }
      await fetchData(); 
      closeModal();
    } catch (err: any) { 
      alert("ERRO AO SALVAR REGISTRO:\n" + (err.message || JSON.stringify(err))); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (type === 'manage_class_students') {
    const currentStudentIds = formData.studentIds || item?.studentIds || [];
    return (
      <div className="space-y-6">
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl text-center">
          <p className="text-[9px] font-black text-blue-600 uppercase mb-1 tracking-widest">Gerenciando Turma:</p>
          <p className="text-sm font-black text-blue-900">{item.name}</p>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2 p-2">
          {state.students.map((s:any) => (
            <label key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-blue-500">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={currentStudentIds.map(String).includes(String(s.id))}
                onChange={e => {
                  const sid = String(s.id);
                  const next = e.target.checked 
                    ? [...currentStudentIds, sid] 
                    : currentStudentIds.filter((id:any) => String(id) !== sid);
                  setFormData({...formData, studentIds: next});
                }} 
              />
              <span className="text-xs font-bold text-slate-700">{s.name} <span className="text-[9px] text-slate-400 font-mono ml-2">#{s.id}</span></span>
            </label>
          ))}
          {state.students.length === 0 && <p className="text-center py-6 text-xs text-slate-400 italic">Nenhum aluno cadastrado.</p>}
        </div>
        <button 
          disabled={isSaving}
          onClick={async () => {
            setIsSaving(true);
            try {
              await db.syncClassStudents(item.id, currentStudentIds);
              await fetchData();
              closeModal();
            } catch(e:any) {
              alert(e.message);
            } finally {
              setIsSaving(false);
            }
          }}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20}/> : "SALVAR LISTA"}
        </button>
      </div>
    );
  }

  if (type === 'link_patient') {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault(); 
        setIsSaving(true);
        try { 
          if (!formData.patientId) return; 
          await db.update('patients', formData.patientId, { analystId: item.id }); 
          await fetchData(); 
          closeModal(); 
        } catch(e:any) { 
          alert(e.message); 
        } finally { 
          setIsSaving(false); 
        }
      }} className="space-y-6">
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-center">
          <p className="text-[9px] font-black text-rose-600 uppercase mb-1 tracking-widest">Atribuindo ao Psicanalista:</p>
          <p className="text-sm font-black text-rose-900">{item.name}</p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Selecionar Paciente</label>
          <select className="w-full p-5 border-2 border-slate-50 rounded-2xl bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-xs text-slate-700 appearance-none" value={formData.patientId || ""} onChange={e => setFormData({...formData, patientId: e.target.value})} required>
            <option value="">Buscar paciente...</option>
            {state.patients.filter((p:any) => !p.analystId).map((p:any) => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
          </select>
        </div>
        <button disabled={isSaving} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black shadow-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">VINCULAR AGORA</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type.includes('student') && (
        <>
          <InputField label="Nome Completo" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required placeholder="Ex: João da Silva" />
          <InputField label="E-mail" type="email" value={formData.email} onChange={(v:any) => setFormData({...formData, email: v})} required placeholder="contato@exemplo.com" />
          <InputField label="Telefone / Whats" value={formData.phone} onChange={(v:any) => setFormData({...formData, phone: v})} placeholder="(00) 00000-0000" />
        </>
      )}
      {type.includes('employee') && (
        <>
          <InputField label="Nome do Profissional" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required />
          <InputField label="E-mail Corporativo" value={formData.email} onChange={(v:any) => setFormData({...formData, email: v})} />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cargo</label>
            <select className="w-full p-5 border-2 border-slate-50 rounded-2xl bg-slate-50 focus:border-blue-500 outline-none font-black text-xs text-slate-700" value={formData.role || ""} onChange={(e:any) => setFormData({...formData, role: e.target.value})} required>
              <option value="">Selecione...</option>
              <option value="Professor">Professor(a)</option>
              <option value="Secretaria">Secretaria</option>
              <option value="Diretoria">Diretoria</option>
            </select>
          </div>
        </>
      )}
      {type.includes('course') && (
        <>
          <InputField label="Título do Curso" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required />
          <InputField label="Duração" value={formData.duration} onChange={(v:any) => setFormData({...formData, duration: v})} placeholder="Ex: 12 meses" />
          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ementa Curricular</label>
              <button type="button" onClick={async () => { setIsGenerating(true); const d = await generateCourseDescription(formData.name); setFormData({...formData, description: d}); setIsGenerating(false); }} className="text-[8px] text-blue-600 font-black flex gap-1 items-center hover:bg-blue-50 px-2 py-1 rounded-md transition-all">
                {isGenerating ? <Loader2 className="animate-spin" size={10}/> : <BrainCircuit size={10}/>} IA SUGGEST
              </button>
            </div>
            <textarea className="w-full p-5 border-2 border-slate-50 rounded-2xl text-xs h-32 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none font-bold transition-all scrollbar-hide" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </>
      )}
      {type.includes('class') && (
        <>
          <InputField label="Identificador da Turma" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required placeholder="Ex: TURMA-A-2024" />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Curso Base</label>
            <select className="w-full p-5 border-2 border-slate-50 rounded-2xl bg-slate-50 focus:border-blue-500 outline-none font-black text-xs text-slate-700 appearance-none" value={formData.courseId || ""} onChange={e => setFormData({...formData, courseId: e.target.value})} required>
              <option value="">Escolher curso...</option>
              {state.courses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}
      {type.includes('analyst') && (
        <>
          <InputField label="Nome do Analista" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required />
          <InputField label="Especialidade / Abordagem" value={formData.specialty} onChange={(v:any) => setFormData({...formData, specialty: v})} placeholder="Ex: Lacaniana, Winicott..." />
        </>
      )}
      {type.includes('patient') && (
        <>
          <InputField label="Nome do Paciente" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} required />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" type="date" value={formData.birthDate} onChange={(v:any) => setFormData({...formData, birthDate: v})} />
            <InputField label="Valor Social (R$)" type="number" value={formData.socialValue} onChange={(v:any) => setFormData({...formData, socialValue: v})} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Psicanalista Responsável</label>
            <select className="w-full p-5 border-2 border-slate-50 rounded-2xl bg-slate-50 focus:border-blue-500 outline-none font-black text-xs text-slate-700 appearance-none" value={formData.analystId || ""} onChange={e => setFormData({...formData, analystId: e.target.value})}>
              <option value="">Selecionar profissional...</option>
              {state.psychoanalysts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <InputField label="Renda Familiar" value={formData.familyIncome} onChange={(v:any) => setFormData({...formData, familyIncome: v})} placeholder="Ex: R$ 3.000,00" />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Notas do Caso</label>
            <textarea className="w-full p-5 border-2 border-slate-50 rounded-2xl text-xs h-32 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none font-bold transition-all scrollbar-hide" value={formData.clinicalNotes} onChange={e => setFormData({...formData, clinicalNotes: e.target.value})} />
          </div>
        </>
      )}
      {type.includes('user') && (
        <>
          <InputField label="Usuário de Acesso" value={formData.username} onChange={(v:any) => setFormData({...formData, username: v})} required />
          <InputField label="Senha de Acesso" type="password" value={formData.password} onChange={(v:any) => setFormData({...formData, password: v})} required />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Permissões</label>
            <select className="w-full p-5 border-2 border-slate-50 rounded-2xl bg-slate-50 font-black text-xs" value={formData.role || "USER"} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="USER">Usuário Comum</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </>
      )}
      <div className="pt-6">
        <button disabled={isSaving} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl hover:bg-blue-700 transition-all flex justify-center items-center gap-3 disabled:opacity-50 active:scale-95">
          {isSaving ? <Loader2 className="animate-spin" size={24}/> : "SALVAR ALTERAÇÕES"}
        </button>
      </div>
    </form>
  );
};

const InputField = ({ label, type = 'text', value, onChange, required = false, placeholder = "" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
    <input type={type} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xs focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-black text-slate-700" value={value || ''} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} />
  </div>
);

export default App;