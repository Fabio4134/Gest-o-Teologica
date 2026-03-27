import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, AuthContext, LoginView } from './components/Auth';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { supabase } from './supabaseClient';
import { UserProfile, Course, StudentDetails, Attendance, Question, Exam, ExamResult, FinancialRecord, TeacherDetails } from './types';
import { LogIn, LogOut, GraduationCap, BookOpen, Users, ClipboardCheck, FileText, DollarSign, BarChart3, Download, Plus, Trash2, CheckCircle2, XCircle, Search, Filter, Clock, Calendar, Award, AlertCircle, UserCog, Edit3, ArrowRight, ChevronRight, FileUp, Sparkles, Wand2, FileSearch, FileSpreadsheet, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import { QuizTheosPro } from './components/QuizTheosPro';
import 'jspdf-autotable';

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Algo deu errado</h2>
            <p className="text-stone-500 mb-6 text-center">Ocorreu um erro inesperado no sistema.</p>
            <pre className="bg-stone-50 p-4 rounded-xl text-xs text-stone-600 overflow-auto max-h-40 mb-6">
              {this.state.error?.message || JSON.stringify(this.state.error)}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Dashboard View ---
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ students: 0, courses: 0, exams: 0, income: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: courseCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });
        
        setStats(prev => ({ 
          ...prev, 
          students: studentCount || 0, 
          courses: courseCount || 0, 
          exams: examCount || 0 
        }));

        if (user?.role === 'master') {
          const { data: finances } = await supabase.from('finances').select('amount, type');
          if (finances) {
            const total = finances.reduce((acc, curr) => {
              return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
            }, 0);
            setStats(prev => ({ ...prev, income: total }));
          }
        }
      } catch (e) {
        handleSupabaseError(e, OperationType.GET, 'stats');
      }
    };

    fetchStats();
  }, [user]);

  const data = [
    { name: 'Alunos', value: stats.students },
    { name: 'Disciplinas', value: stats.courses },
    { name: 'Provas', value: stats.exams },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-stone-900">Bem-vindo, {user?.displayName}</h1>
        <p className="text-stone-500 italic serif">Visão geral do sistema teológico</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total de Alunos" value={stats.students} color="bg-blue-500" />
        <StatCard icon={BookOpen} label="Disciplinas Ativas" value={stats.courses} color="bg-[var(--color-primary-500)]" />
        <StatCard icon={FileText} label="Provas Realizadas" value={stats.exams} color="bg-amber-500" />
        <StatCard icon={DollarSign} label="Saldo Financeiro" value={`R$ ${stats.income.toFixed(2)}`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-[var(--color-primary-600)]" /> Estatísticas Rápidas
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="text-[var(--color-primary-600)]" /> Atividades Recentes
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">Nova matrícula realizada</p>
                  <p className="text-xs text-stone-500">Há 2 horas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-stone-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
    </div>
  </div>
);

// --- Courses View ---
// --- Subjects View ---
const SubjectsView = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modal, setModal] = useState<{ show: boolean, title: string, message: string, onConfirm?: () => void, type: 'alert' | 'confirm' }>({ show: false, title: '', message: '', type: 'alert' });

  const showAlert = (title: string, message: string) => setModal({ show: true, title, message, type: 'alert' });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setModal({ show: true, title, message, onConfirm, type: 'confirm' });

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*');
      
      if (error) handleSupabaseError(error, OperationType.GET, 'subjects');
      else setSubjects(data || []);
    };

    fetchSubjects();

    // Set up real-time listener
    const channel = supabase
      .channel('subjects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
        fetchSubjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async () => {
    if (!formData.name) return;
    const { error } = await supabase
      .from('subjects')
      .insert([{ 
        name: formData.name, 
        description: formData.description, 
        teacher_id: user?.uid 
      }]);
    
    if (error) handleSupabaseError(error, OperationType.CREATE, 'subjects');
    else {
      setIsAdding(false);
      setFormData({ name: '', description: '' });
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject || !formData.name) return;
    const { error } = await supabase
      .from('subjects')
      .update({ 
        name: formData.name, 
        description: formData.description 
      })
      .eq('id', editingSubject.id);
    
    if (error) handleSupabaseError(error, OperationType.UPDATE, 'subjects');
    else {
      setEditingSubject(null);
      setFormData({ name: '', description: '' });
    }
  };

  const importStandardSubjects = async () => {
    const standard = [
      "Cristologia", "Epístolas Paulinas", "Escatologia", "Escola Dominical",
      "Evangelhos e Atos", "Evangelismo", "Evidência Cristã",
      "Fundamentos da Psicologia e do Aconselhamento", "Geografia Bíblica",
      "Hebreus e Epístolas Gerais", "Hermenêutica", "História da Igreja",
      "Homilética", "Introdução ao Novo Testamento", "Introdução Bíblica",
      "Livros Históricos", "Livros Poéticos", "Maneiras e Costumes Bíblicos",
      "Missiologia", "Pentateuco", "Profetas Maiores e Menores",
      "Religiões Comparadas", "Teologia Pastoral", "Teologia Sistemática"
    ];

    const existingNames = subjects.map(s => s.name);
    const toAdd = standard.filter(name => !existingNames.includes(name));

    if (toAdd.length === 0) {
      showAlert('Informação', 'Todas as matérias padrão já estão cadastradas.');
      return;
    }

    showConfirm('Confirmar Importação', `Deseja importar ${toAdd.length} novas disciplinas padrão?`, async () => {
      const inserts = toAdd.map(name => ({
        name,
        description: `Disciplina de ${name} do currículo teológico.`,
        teacher_id: user?.uid
      }));

      const { error } = await supabase.from('subjects').insert(inserts);
      
      if (error) handleSupabaseError(error, OperationType.CREATE, 'subjects (bulk)');
      else showAlert('Sucesso', 'Disciplinas importadas com sucesso!');
    });
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const currentSubject = subjects.find(s => s.id === selectedId) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-0 items-start bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden min-h-[calc(100vh-140px)]">
      {modal.show && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 mb-2">{modal.title}</h3>
            <p className="text-stone-500 mb-6">{modal.message}</p>
            <div className="flex gap-3">
              {modal.type === 'confirm' && (
                <button 
                   onClick={() => { modal.onConfirm?.(); setModal({ ...modal, show: false }); }}
                   className="flex-1 bg-[var(--color-primary-600)] text-white py-2 rounded-xl font-bold transition-all"
                >
                  Confirmar
                </button>
              )}
              <button 
                onClick={() => setModal({ ...modal, show: false })}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${modal.type === 'confirm' ? 'bg-stone-100 text-stone-600' : 'bg-stone-900 text-white'}`}
              >
                {modal.type === 'confirm' ? 'Cancelar' : 'Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar de Disciplinas (Esquerda) (Padronizada) */}
      <aside className="w-full lg:w-80 shrink-0 border-r border-stone-100 flex flex-col h-[calc(100vh-140px)] bg-white">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-stone-800 text-base">Disciplinas</h3>
          <button 
             onClick={() => setIsAdding(true)}
             className="w-8 h-8 rounded-lg bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-all flex items-center justify-center font-bold"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredSubjects.map(s => {
            const isSelected = selectedId === s.id;
            return (
              <motion.div
                key={s.id}
                layout
                onClick={() => setSelectedId(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  isSelected 
                    ? 'bg-[#B45309] border-[#B45309] text-white shadow-lg shadow-amber-900/10' 
                    : 'bg-white border-stone-100 hover:border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex gap-4 items-center relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-stone-100'
                  }`}>
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                      {s.name}
                    </h4>
                    <p className={`text-[10px] font-medium uppercase tracking-widest truncate ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                      CARREGANDO QUESTÕES
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setEditingSubject(s); setFormData({ name: s.name, description: s.description || '' }); }}
                         className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                       >
                         <Edit3 size={14} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); showConfirm('Excluir', `Deseja permanentemente excluir "${s.name}"? Esta ação não pode ser desfeita.`, async () => {
                           const { error } = await supabase.from('subjects').delete().eq('id', s.id);
                           if (error) handleSupabaseError(error, OperationType.DELETE, 'subjects');
                         }); }}
                         className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                       >
                         <Trash2 size={14} />
                       </button>
                       <ArrowRight size={14} className="ml-1 opacity-70" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 border-t border-stone-100 shrink-0">
          <button 
            onClick={importStandardSubjects}
            className="w-full flex items-center justify-center gap-2 bg-stone-50 text-stone-500 px-4 py-3 rounded-xl hover:bg-stone-100 transition-all text-[10px] font-bold uppercase tracking-widest border border-stone-100"
          >
            <Download size={14} /> Importar Base
          </button>
        </div>
      </aside>

      {/* Conteúdo à Direita (Detalhes) */}
      <main className="flex-1 flex flex-col h-[calc(100vh-140px)] bg-stone-50/30">
        {currentSubject ? (
          <>
            <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-1">
                  <span>Disciplinas</span>
                  <span>&gt;</span>
                  <span>Instituto de Ensino Teológico</span>
                </div>
                <h2 className="text-xl font-bold text-stone-900">{currentSubject.name}</h2>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-white text-stone-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-stone-200 hover:bg-stone-50 transition-all">
                  <Download size={16} /> Importar Lote
                </button>
                <button className="flex items-center gap-2 bg-[#B45309] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/10 hover:scale-[1.02] transition-all">
                  <Plus size={16} /> Nova Questão
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
               <div className="w-16 h-1 w-16 h-1 mb-8 opacity-20">
                  <div className="w-full h-px bg-stone-400 mb-1" />
                  <div className="w-full h-px bg-stone-400 mb-1" />
                  <div className="w-full h-px bg-stone-400" />
               </div>
               <p className="text-stone-400 text-sm mb-4">Nenhuma questão cadastrada nesta disciplina</p>
               <button 
                 onClick={() => setIsAdding(true)}
                 className="flex items-center gap-2 text-[var(--color-primary-600)] font-bold text-sm hover:underline"
               >
                 <Plus size={16} /> Adicionar primeira questão
               </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center text-stone-400 italic">
            Selecione uma disciplina para ver os detalhes
          </div>
        )}

        {/* Modal de Adição/Edição (Mantido mas estilizado como no padrão) */}
        <AnimatePresence>
          {(isAdding || editingSubject) && (
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <h3 className="text-xl font-bold text-stone-900">{editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
                  <button 
                    onClick={() => { setIsAdding(false); setEditingSubject(null); setFormData({ name: '', description: '' }); }}
                    className="text-stone-400 hover:text-stone-600 p-2"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Nome da Matéria</label>
                        <input 
                          className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white transition-all"
                          placeholder="Ex: Teologia Sistemática"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Ementa / Descrição</label>
                        <textarea 
                          className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white min-h-[140px] transition-all"
                          placeholder="Descreva os tópicos abordados nesta disciplina..."
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={editingSubject ? handleUpdate : handleAdd} 
                        className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-stone-800 transition-all"
                      >
                        {editingSubject ? 'Salvar Alterações' : 'Criar Disciplina'}
                      </button>
                      <button 
                        onClick={() => { setIsAdding(false); setEditingSubject(null); setFormData({ name: '', description: '' }); }} 
                        className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Enrollment View ---
const EnrollmentView = () => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;
    const tempId = crypto.randomUUID();

    const { error: userError } = await supabase.from('users').insert([{
      id: tempId,
      display_name: displayName,
      email: email,
      role: 'student'
    }]);

    if (userError) {
      handleSupabaseError(userError, OperationType.CREATE, 'users');
      return;
    }

    const detailsData = {
      id: tempId,
      registration_number: formData.get('registrationNumber') as string || `MAT-${Date.now()}`,
      status: 'active',
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      birth_date: formData.get('birthDate') as string,
      cpf: formData.get('cpf') as string,
      church: formData.get('church') as string,
    };

    const { error: studentError } = await supabase.from('students').insert([detailsData]);

    if (studentError) {
      handleSupabaseError(studentError, OperationType.CREATE, 'students');
      return;
    }

    setFeedback({ type: 'success', msg: 'Matrícula realizada com sucesso!' });
    setTimeout(() => setFeedback(null), 3000);
    e.currentTarget.reset();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Nova Matrícula</h2>
          <p className="text-stone-500 italic serif">Portal de ingresso para novos acadêmicos</p>
        </div>
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-green-200"
            >
              <CheckCircle2 size={18} /> {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="glass-card p-10 rounded-3xl border border-stone-200/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-500)]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <form onSubmit={handleSave} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <input name="displayName" required className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="Digite o nome completo do aluno" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Email Institucional</label>
              <input name="email" type="email" required className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="exemplo@igreja.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Telefone de Contato</label>
              <input name="phone" className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">CPF</label>
              <input name="cpf" className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
              <input name="birthDate" type="date" className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Comunidade Cristã / Igreja</label>
              <input name="church" className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="Nome da congregação" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Endereço Residencial</label>
              <input name="address" className="w-full p-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white/50 backdrop-blur-sm transition-all" placeholder="Rua, Número, Bairro, Cidade" />
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-stone-900/20 hover:bg-stone-800 transition-all mt-4"
          >
            Finalizar Cadastro & Matricular
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

// --- Question Bank View ---
const QuestionBankView = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, category: 'Geral' });
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: qData } = await supabase.from('questions').select('*');
      setQuestions(qData || []);
      const { data: sData } = await supabase.from('subjects').select('*').order('name');
      setSubjects(sData || []);
      if (sData && sData.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(sData[0].id);
      }
    };
    fetchData();

    const channel = supabase.channel('questions_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const qData = editingQuestion || newQuestion;
    if (!qData.text) return;
    
    const { error } = await supabase.from('questions').upsert([{
      id: editingQuestion?.id || crypto.randomUUID(),
      text: qData.text,
      options: qData.options,
      correct_option_index: qData.correctOptionIndex,
      category: qData.category,
      subject_id: qData.subjectId
    }]);

    if (error) handleSupabaseError(error, OperationType.WRITE, 'questions');
    else {
      setIsAdding(false);
      setEditingQuestion(null);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, category: 'Geral' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta questão?')) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) handleSupabaseError(error, OperationType.DELETE, 'questions');
    }
  };

  const filteredQuestions = questions.filter(q => 
    (!selectedSubjectId || q.subject_id === selectedSubjectId) &&
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="flex flex-col lg:flex-row gap-0 items-start bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden min-h-[calc(100vh-140px)]">
      {/* Sidebar de Disciplinas (Mesmo padrão do SubjectsView) */}
      <aside className="w-full lg:w-80 shrink-0 border-r border-stone-100 flex flex-col h-[calc(100vh-140px)] bg-white">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-stone-800 text-base">Disciplinas</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {subjects.map(s => {
            const isSelected = selectedSubjectId === s.id;
            const subjectQuestionsCount = questions.filter(q => q.subject_id === s.id).length;
            
            return (
              <motion.div
                key={s.id}
                layout
                onClick={() => setSelectedSubjectId(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  isSelected 
                    ? 'bg-[#B45309] border-[#B45309] text-white shadow-lg shadow-amber-900/10' 
                    : 'bg-white border-stone-100 hover:border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex gap-4 items-center relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-stone-100'
                  }`}>
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                      {s.name}
                    </h4>
                    <p className={`text-[10px] font-medium uppercase tracking-widest truncate ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                      {subjectQuestionsCount} QUESTÕES CADASTRADAS
                    </p>
                  </div>
                  {isSelected && <ChevronRight size={14} className="opacity-70" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </aside>

      {/* Conteúdo Principal (Questões) */}
      <main className="flex-1 flex flex-col h-[calc(100vh-140px)] bg-stone-50/30">
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-1">
              <span>Banco de Questões</span>
              <span>&gt;</span>
              <span>{selectedSubject?.name || 'Geral'}</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900">Gerenciar Questões</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 bg-white text-stone-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-stone-200 hover:bg-stone-50 transition-all font-sans"
            >
              <Download size={16} /> Importar Arquivo
            </button>
            <button 
              onClick={() => setShowAIAssistant(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/10 hover:bg-indigo-700 hover:scale-[1.02] transition-all"
            >
              <Award size={16} className="text-indigo-200" /> IA Especialista
            </button>
            <button 
              onClick={() => {
                setNewQuestion({ ...newQuestion, subjectId: selectedSubjectId || '' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 bg-[#B45309] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/10 hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> Nova Questão
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-stone-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-4 focus:ring-stone-100 transition-all text-sm"
              placeholder="Pesquisar questões..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {(isAdding || editingQuestion) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-8 rounded-3xl border border-[var(--color-primary-500)]/30 shadow-2xl space-y-6 bg-white"
              >
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Enunciado da Questão</label>
                      <textarea 
                        className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-[var(--color-primary-500)]/10 bg-white min-h-[100px]"
                        placeholder="Digite a pergunta da questão..."
                        value={editingQuestion?.text || newQuestion.text}
                        onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, text: e.target.value}) : setNewQuestion({...newQuestion, text: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Disciplina</label>
                      <select 
                        className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-[var(--color-primary-500)]/10 bg-white"
                        value={editingQuestion?.subjectId || newQuestion.subjectId}
                        onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, subjectId: e.target.value}) : setNewQuestion({...newQuestion, subjectId: e.target.value})}
                      >
                        <option value="">Selecione a disciplina...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Opção Correta (0-3)</label>
                      <select 
                        className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-[var(--color-primary-500)]/10 bg-white cursor-pointer"
                        value={editingQuestion?.correctOptionIndex || newQuestion.correctOptionIndex}
                        onChange={e => {
                          const idx = parseInt(e.target.value);
                          editingQuestion ? setEditingQuestion({...editingQuestion, correctOptionIndex: idx}) : setNewQuestion({...newQuestion, correctOptionIndex: idx});
                        }}
                      >
                        {[0,1,2,3].map(i => <option key={i} value={i}>Opção {i + 1}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Alternativa {i + 1}</label>
                        <input 
                          className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                            (editingQuestion?.correctOptionIndex === i || newQuestion.correctOptionIndex === i) 
                              ? 'border-[#B45309] bg-amber-50/30 ring-2 ring-amber-500/10' 
                              : 'border-stone-200 focus:border-stone-400 bg-white'
                          }`}
                          placeholder={`Digite a opção ${i + 1}`}
                          value={editingQuestion?.options[i] || newQuestion.options?.[i] || ''}
                          onChange={e => {
                            const opts = [...(editingQuestion?.options || newQuestion.options || [])];
                            opts[i] = e.target.value;
                            editingQuestion ? setEditingQuestion({...editingQuestion, options: opts}) : setNewQuestion({...newQuestion, options: opts});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-stone-100">
                    <button type="submit" className="flex-1 bg-[#B45309] text-white py-4 rounded-2xl font-bold shadow-xl shadow-amber-900/10 hover:scale-[1.01] transition-all">Salvar Questão</button>
                    <button type="button" onClick={() => { setIsAdding(false); setEditingQuestion(null); }} className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Descartar</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuestions.map(q => (
                <motion.div 
                  key={q.id}
                  layout
                  className="glass-card p-6 rounded-3xl border border-stone-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-[#B45309]/30 transition-all bg-white shadow-sm"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-50 text-[#B45309] text-[10px] font-bold uppercase rounded-lg tracking-widest">{subjects.find(s => s.id === q.subject_id)?.name || 'Geral'}</span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">ID: {q.id.slice(0,8)}</span>
                    </div>
                    <h5 className="text-stone-900 font-bold leading-relaxed">{q.text}</h5>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <button 
                      onClick={() => setEditingQuestion(q)}
                      className="p-3 rounded-xl bg-stone-50 text-stone-400 hover:text-[#B45309] hover:bg-amber-50 transition-all border border-stone-100"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <p className="text-stone-400 text-sm mb-4">Nenhuma questão encontrada para os filtros aplicados</p>
              <button 
                 onClick={() => setIsAdding(true)}
                 className="flex items-center gap-2 text-[#B45309] font-bold text-sm hover:underline"
               >
                 <Plus size={16} /> Criar nova questão
               </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal IA Especialista */}
      <AnimatePresence>
        {showAIAssistant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIAssistant(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-7xl h-[92vh] bg-stone-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/5"
            >
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-indigo-600 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Wand2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">IA Especialista em Questões</h2>
                    <p className="text-indigo-100/70 text-xs font-medium">Geração inteligente de avaliações via PDF/PPTX</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIAssistant(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-stone-950">
                <QuizTheosPro 
                  subjects={subjects} 
                  selectedSubjectId={selectedSubjectId}
                  onClose={() => setShowAIAssistant(false)}
                  onImport={async (qs: any[]) => {
                    const finalSubjectId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : null);
                    
                    if (!finalSubjectId) {
                      alert("Erro: Nenhuma disciplina encontrada. Crie uma disciplina antes de importar.");
                      return;
                    }

                    const mappedQs = qs.map(q => ({
                      text: q.text,
                      options: q.options || ['', '', '', ''],
                      correct_option_index: q.correctOptionIndex || 0,
                      subject_id: finalSubjectId, 
                      category: 'IA'
                    }));
                    
                    console.log(`Importando ${mappedQs.length} questões para a disciplina ID: ${finalSubjectId}`);
                    const { error } = await supabase.from('questions').insert(mappedQs);
                    
                    if (error) {
                      console.error("Erro na importação (Tentativa 1):", error);
                      // Fallback para subjectId (camelCase)
                      const retryQs = mappedQs.map(q => ({
                        text: q.text,
                        options: q.options,
                        correct_option_index: q.correct_option_index,
                        subjectId: finalSubjectId,
                        category: q.category
                      }));
                      const { error: error2 } = await supabase.from('questions').insert(retryQs);
                      
                      if (error2) {
                         alert("Falha Crítica na Importação: " + error2.message);
                      } else {
                         alert("Sucesso! Questões importadas com mapeamento alternativo.");
                         setShowAIAssistant(false);
                      }
                    } else {
                      alert(`Sucesso! ${mappedQs.length} questões adicionadas ao seu Banco de Questões.`);
                      setShowAIAssistant(false);
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Importação de Arquivos */}
      <AnimatePresence>
        {showImportDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportDialog(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-stone-100"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3">
                <Download className="text-indigo-600" /> Importar Questões
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'PDF (.pdf)', icon: FileText, color: 'text-red-500 bg-red-50' },
                  { label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50' },
                  { label: 'Word (.docx)', icon: FileSearch, color: 'text-blue-500 bg-blue-50' }
                ].map((type, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-indigo-500 hover:bg-stone-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                        <type.icon size={20} />
                      </div>
                      <span className="font-bold text-stone-700">{type.label}</span>
                    </div>
                    <ArrowRight size={18} className="text-stone-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))}
              </div>
              
              <p className="mt-8 text-xs text-stone-400 text-center uppercase tracking-widest font-bold">
                ou arraste o arquivo aqui
              </p>
              
              <button 
                onClick={() => setShowImportDialog(false)}
                className="mt-6 w-full py-4 text-stone-500 font-bold text-sm hover:text-stone-800"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};




// --- Results View ---
const ResultsView = () => {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Record<string, Exam>>({});
  const [students, setStudents] = useState<Record<string, UserProfile>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let resultsQuery = supabase.from('exam_results').select('*');
        if (user?.role === 'student') {
          resultsQuery = resultsQuery.eq('student_id', user.uid);
        }
        const { data: resData } = await resultsQuery;
        setResults(resData || []);

        const { data: exData } = await supabase.from('exams').select('*');
        const eMap: Record<string, Exam> = {};
        exData?.forEach(d => eMap[d.id] = d as Exam);
        setExams(eMap);

        let usersQuery = supabase.from('users').select('*');
        const { data: uData } = await usersQuery;
        const uMap: Record<string, UserProfile> = {};
        uData?.forEach(d => uMap[d.id] = {
          uid: d.id,
          displayName: d.display_name,
          email: d.email,
          role: d.role,
          createdAt: d.created_at
        } as UserProfile);
        setStudents(uMap);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'results_data');
      }
    };
    fetchData();
  }, [user]);

  const filtered = results.filter(r => {
    const studentName = students[r.studentId]?.displayName || '';
    const examTitle = exams[r.examId]?.title || '';
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || examTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Desempenho Acadêmico</h2>
          <p className="text-stone-500 italic serif">Histórico de avaliações e notas</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Média Geral</span>
            <span className="text-xl font-bold text-[var(--color-primary-600)]">
              {(results.reduce((acc, r) => acc + r.score, 0) / (results.length || 1)).toFixed(1)}
            </span>
          </div>
          <div className="w-px h-8 bg-stone-100" />
          <Award className="text-amber-500" size={24} />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          className="w-full pl-14 pr-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white shadow-sm transition-all"
          placeholder="Buscar resultado por aluno ou prova..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filtered.map(res => (
            <motion.div 
              key={res.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 rounded-3xl border border-stone-200/50 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[var(--color-primary-500)]/30 transition-all"
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${
                  res.score >= 7 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {res.score.toFixed(1)}
                </div>
                <div className="min-w-0">
                  <h5 className="text-lg font-bold text-stone-900 truncate">{exams[res.examId]?.title || 'Avaliação Excluída'}</h5>
                  <p className="text-sm text-stone-500 flex items-center gap-2">
                    <Users size={14} className="text-stone-300" />
                    {students[res.studentId]?.displayName || 'Aluno não identificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Finalizado Em</p>
                  <p className="text-sm font-medium text-stone-600 flex items-center gap-2 justify-end">
                    <Calendar size={14} className="text-stone-300" />
                    {format(new Date(res.completedAt), 'dd/MM/yyyy')}
                  </p>
                </div>
                <button className="p-3 rounded-xl bg-stone-50 text-stone-400 hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] transition-all border border-stone-100 shadow-sm">
                  <FileText size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
// --- Students View ---
const StudentsView = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studentDetails, setStudentDetails] = useState<Record<string, StudentDetails>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<{ user: UserProfile, details: StudentDetails } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*').eq('role', 'student');
        setStudents(usersData?.map(u => ({
          uid: u.id,
          displayName: u.display_name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
          photoURL: u.photo_url
        } as UserProfile)) || []);

        const { data: detailsData } = await supabase.from('students').select('*');
        const dMap: Record<string, StudentDetails> = {};
        detailsData?.forEach(d => {
          dMap[d.id] = {
            uid: d.id,
            registrationNumber: d.registration_number,
            status: d.status,
            enrollmentDate: d.enrollment_date,
            phone: d.phone,
            address: d.address,
            birthDate: d.birth_date,
            cpf: d.cpf,
            church: d.church
          } as StudentDetails;
        });
        setStudentDetails(dMap);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'students_data');
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (uid: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      const { error: error1 } = await supabase.from('students').delete().eq('id', uid);
      const { error: error2 } = await supabase.from('users').delete().eq('id', uid);
      if (error1 || error2) handleSupabaseError(error1 || error2, OperationType.DELETE, 'student');
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const uid = editingStudent?.user.uid || crypto.randomUUID();
    
    const userUpdate = {
      id: uid,
      display_name: formData.get('displayName') as string,
      email: formData.get('email') as string,
      role: 'student'
    };

    const detailsUpdate = {
      id: uid,
      registration_number: formData.get('registrationNumber') as string || `MAT-${Date.now()}`,
      status: formData.get('status') as any || 'active',
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      birth_date: formData.get('birthDate') as string,
      cpf: formData.get('cpf') as string,
      church: formData.get('church') as string,
    };

    const { error: uErr } = await supabase.from('users').upsert([userUpdate]);
    const { error: dErr } = await supabase.from('students').upsert([detailsUpdate]);
    
    if (uErr || dErr) handleSupabaseError(uErr || dErr, OperationType.WRITE, 'student_save');

    setEditingStudent(null);
    setIsAdding(false);
    // Refresh data would be better here or use real-time
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Alunos', 14, 15);
    const tableData = filtered.map(s => [
      s.displayName,
      s.email,
      studentDetails[s.uid]?.registrationNumber || '---',
      studentDetails[s.uid]?.status === 'active' ? 'Ativo' : studentDetails[s.uid]?.status === 'graduated' ? 'Formado' : studentDetails[s.uid]?.status === 'pending' ? 'Pendente' : 'Inativo'
    ]);
    (doc as any).autoTable({
      head: [['Nome', 'Email', 'Matrícula', 'Status']],
      body: tableData,
      startY: 20,
    });
    doc.save('relatorio_alunos.pdf');
  };

  const filtered = students.filter(s => s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Gestão de Alunos</h2>
          <p className="text-stone-500 italic serif">Controle de matrículas e perfis detalhados</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-200 transition-all font-bold"
          >
            <Download size={20} /> PDF
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-xl text-[var(--color-primary-600)] transition-all shadow-lg shadow-[var(--color-primary-500)]/20"
          >
            <Plus size={20} /> Matricular Aluno
          </button>
        </div>
      </div>

      {(isAdding || editingStudent) && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-xl font-bold text-stone-900">{editingStudent ? 'Editar Aluno' : 'Nova Matrícula'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingStudent(null); }} className="text-stone-400 hover:text-stone-600"><XCircle /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Nome Completo</label>
                  <input name="displayName" defaultValue={editingStudent?.user.displayName} required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Email</label>
                  <input name="email" type="email" defaultValue={editingStudent?.user.email} required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Telefone</label>
                  <input name="phone" defaultValue={editingStudent?.details?.phone} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">CPF</label>
                  <input name="cpf" defaultValue={editingStudent?.details?.cpf} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Data de Nascimento</label>
                  <input name="birthDate" type="date" defaultValue={editingStudent?.details?.birthDate} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Igreja</label>
                  <input name="church" defaultValue={editingStudent?.details?.church} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Endereço</label>
                  <input name="address" defaultValue={editingStudent?.details?.address} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Status</label>
                  <select name="status" defaultValue={editingStudent?.details?.status || 'active'} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="graduated">Formado</option>
                    <option value="pending">Pendente (Aguardando Aprovação)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Nº Matrícula</label>
                  <input name="registrationNumber" defaultValue={editingStudent?.details?.registrationNumber} placeholder="Automático se vazio" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-[var(--color-primary-600)] text-white py-3 rounded-xl font-bold text-[var(--color-primary-600)] transition-all">Salvar Registro</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingStudent(null); }} className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-xl font-bold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white transition-all shadow-sm"
          placeholder="Buscar aluno por nome, email ou igreja..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map(s => (
            <motion.div 
              key={s.uid}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 rounded-3xl border border-stone-200/50 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-500)]/5 rounded-full -mr-12 -mt-12 blur-2xl transition-all group-hover:bg-[var(--color-primary-500)]/10" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-pink)] p-[2px] shadow-lg shadow-purple-500/10">
                  <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-xl font-bold text-[var(--color-primary-600)] overflow-hidden">
                    {s.photoURL ? <img src={s.photoURL} alt="" className="w-full h-full object-cover" /> : s.displayName[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-stone-900 truncate">{s.displayName}</h4>
                  <p className="text-xs text-stone-400 truncate">{s.email}</p>
                </div>
                <div 
                  className={`w-3 h-3 rounded-full ${studentDetails[s.uid]?.status === 'active' ? 'bg-green-500' : studentDetails[s.uid]?.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'} shadow-sm`} 
                  title={studentDetails[s.uid]?.status === 'pending' ? 'Aguardando Aprovação' : ''} 
                />
              </div>

              <div className="space-y-3 mb-6 relative z-10">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                    <Users size={14} />
                  </div>
                  <span className="truncate">{studentDetails[s.uid]?.church || 'Comunidade não informada'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                    <FileText size={14} />
                  </div>
                  <span className="font-mono text-xs">{studentDetails[s.uid]?.registrationNumber || 'MAT-PENDENTE'}</span>
                </div>
              </div>

              <div className="flex gap-2 relative z-10 mt-auto">
                <button 
                  onClick={() => setEditingStudent({ user: s, details: studentDetails[s.uid] })}
                  className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all text-sm shadow-lg shadow-stone-900/10"
                >
                  Editar Perfil
                </button>
                <button 
                  onClick={() => handleDelete(s.uid)}
                  className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Teachers View ---
const TeachersView = () => {
  const { user } = useContext(AuthContext);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [teacherDetails, setTeacherDetails] = useState<Record<string, TeacherDetails>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<{ user: UserProfile, details: TeacherDetails } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*').eq('role', 'teacher');
        setTeachers(usersData?.map(u => ({
          uid: u.id,
          displayName: u.display_name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
          photoURL: u.photo_url
        } as UserProfile)) || []);

        const { data: detailsData } = await supabase.from('teachers').select('*');
        const dMap: Record<string, TeacherDetails> = {};
        detailsData?.forEach(d => {
          dMap[d.id] = {
            uid: d.id,
            bio: d.bio,
            specialization: d.specialization,
            phone: d.phone,
            email: d.email,
            curriculum: d.curriculum
          } as TeacherDetails;
        });
        setTeacherDetails(dMap);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'teachers_data');
      }
    };
    fetchData();
  }, []);

  const filtered = teachers.filter(t => t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const uid = editingTeacher?.user.uid || crypto.randomUUID();
    
    const userUpdate = {
      id: uid,
      display_name: formData.get('displayName') as string,
      email: formData.get('email') as string,
      role: 'teacher'
    };

    const detailsUpdate = {
      id: uid,
      bio: formData.get('bio') as string,
      specialization: formData.get('specialization') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      curriculum: formData.get('curriculum') as string,
    };

    const { error: uErr } = await supabase.from('users').upsert([userUpdate]);
    const { error: dErr } = await supabase.from('teachers').upsert([detailsUpdate]);
    
    if (uErr || dErr) handleSupabaseError(uErr || dErr, OperationType.WRITE, 'teacher_save');
    
    setEditingTeacher(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Corpo Docente</h2>
          <p className="text-stone-500 italic serif">Gestão de professores e especializações</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-600)] text-white px-6 py-3 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-[var(--color-primary-500)]/20 font-bold"
        >
          <Plus size={20} /> Adicionar Professor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white transition-all shadow-sm"
          placeholder="Buscar professor por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {(isAdding || editingTeacher) && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-xl font-bold text-stone-900">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingTeacher(null); }} className="text-stone-400 hover:text-stone-600"><XCircle /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Nome Completo</label>
                  <input name="displayName" defaultValue={editingTeacher?.user.displayName} required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Email</label>
                  <input name="email" type="email" defaultValue={editingTeacher?.user.email} required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Especialização</label>
                  <input name="specialization" defaultValue={editingTeacher?.details?.specialization} placeholder="Ex: Teologia Sistemática" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Telefone</label>
                  <input name="phone" defaultValue={editingTeacher?.details?.phone} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Biografia Curta</label>
                  <textarea name="bio" defaultValue={editingTeacher?.details?.bio} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none h-20" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Currículo / Formação Acadêmica</label>
                  <textarea name="curriculum" defaultValue={editingTeacher?.details?.curriculum} className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none h-32" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all">Salvar Professor</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingTeacher(null); }} className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-xl font-bold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filtered.map(teacher => {
            const details = teacherDetails[teacher.uid];
            return (
              <motion.div 
                key={teacher.uid}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-3xl border border-stone-200/50 flex flex-col group relative overflow-hidden"
              >
                <div className="flex gap-6 items-start relative z-10">
                  <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center text-stone-400 shrink-0 border border-stone-200/50 shadow-inner group-hover:scale-110 transition-transform">
                    {teacher.photoURL ? (
                      <img src={teacher.photoURL} alt="" className="w-full h-full rounded-[23px] object-cover" />
                    ) : (
                      <Users size={32} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xl font-bold text-stone-900 truncate">{teacher.displayName}</h4>
                      <button 
                        onClick={() => setEditingTeacher({ user: teacher, details: details || {} as TeacherDetails })}
                        className="text-stone-300 hover:text-[var(--color-primary-600)] transition-colors p-1"
                      >
                        <FileText size={20} />
                      </button>
                    </div>
                    <p className="text-sm text-[var(--color-primary-600)] font-bold tracking-wide uppercase">{details?.specialization || 'Professor Coordenador'}</p>
                    <p className="mt-4 text-stone-500 text-sm line-clamp-3 leading-relaxed italic serif">{details?.bio || 'Professor dedicado à formação teológica e ministerial.'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between relative z-10">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-400">ST</div>
                    <div className="w-8 h-8 rounded-full bg-stone-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-300">BD</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-[var(--color-primary-400)]" /> Ativo
                    </div>
                    {user?.role === 'master' && (
                      <button 
                        onClick={async () => {
                          const newRole = teacher.role === 'master' ? 'teacher' : 'master';
                          if (confirm(`Promover ${teacher.displayName} a Mestre?`)) {
                            const { error } = await supabase.from('users').update({ role: newRole }).eq('id', teacher.uid);
                            if (!error) window.location.reload();
                          }
                        }}
                        className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg border transition-all ${
                          teacher.role === 'master' 
                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                            : 'bg-white border-stone-200 text-stone-400 hover:border-amber-500 hover:text-amber-500'
                        }`}
                      >
                         Mestre
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Attendance View ---
const AttendanceView = () => {
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [lessonTopic, setLessonTopic] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('*');
      setSubjects(data || []);
    };
    const fetchStudents = async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'student');
      setStudents(data?.map(u => ({
        uid: u.id,
        displayName: u.display_name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        photoURL: u.photo_url
      } as UserProfile)) || []);
    };
    fetchSubjects();
    fetchStudents();
  }, []);

  const handleSave = async () => {
    if (!selectedSubject || !lessonTopic) return;
    const { error } = await supabase.from('attendance').insert([{
      subject_id: selectedSubject,
      lesson_topic: lessonTopic,
      date: new Date().toISOString(),
      present_student_ids: presentIds
    }]);

    if (error) handleSupabaseError(error, OperationType.CREATE, 'attendance');
    else {
      setStatus({ type: 'success', msg: 'Chamada registrada com sucesso!' });
      setLessonTopic('');
      setPresentIds([]);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Chamada Online</h2>
          <p className="text-stone-500 italic serif">Registro diário de presença por aula</p>
        </div>
        {status && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-green-200"
          >
            <CheckCircle2 size={18} /> {status.msg}
          </motion.div>
        )}
      </header>

      <div className="glass-card p-8 rounded-3xl border border-stone-200/50 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Disciplina</label>
            <select 
              className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-[var(--color-primary-500)]/10 bg-white transition-all appearance-none cursor-pointer"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="">Selecione uma disciplina...</option>
              {subjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Assunto da Aula</label>
            <input 
              className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-[var(--color-primary-500)]/10 bg-white transition-all"
              placeholder="Digite o tema abordado..."
              value={lessonTopic}
              onChange={e => setLessonTopic(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-stone-400 font-medium">
            <span className="text-[var(--color-primary-600)] font-bold">{presentIds.length}</span> alunos selecionados
          </div>
          <button 
            onClick={handleSave}
            disabled={!selectedSubject || !lessonTopic}
            className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold disabled:opacity-30 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-stone-900/20"
          >
            Finalizar Chamada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.map(student => {
          const isPresent = presentIds.includes(student.uid);
          return (
            <motion.button
              key={student.uid}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isPresent) setPresentIds(presentIds.filter(id => id !== student.uid));
                else setPresentIds([...presentIds, student.uid]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                isPresent 
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/50' 
                  : 'bg-white border-stone-100 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${isPresent ? 'bg-[var(--color-primary-500)] text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {student.displayName[0]}
                </div>
                <div className="text-left">
                  <span className={`block font-bold text-sm ${isPresent ? 'text-[var(--color-primary-900)]' : 'text-stone-700'}`}>{student.displayName}</span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">{isPresent ? 'Presente' : 'Ausente'}</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isPresent ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white' : 'border-stone-200'}`}>
                {isPresent && <CheckCircle2 size={16} />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// --- Exams View ---
const ExamsView = () => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [newExam, setNewExam] = useState<Partial<Exam>>({ title: '', questions: [], durationMinutes: 60, active: true });
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: qData } = await supabase.from('questions').select('*');
        setQuestions(qData || []);
        
        const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
        setExams(exData || []);
        
        const { data: sData } = await supabase.from('subjects').select('*').order('name');
        setSubjects(sData || []);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'exams_initial_data');
      }
    };
    fetchData();
  }, []);

  const generateExamPDF = (exam: Exam) => {
    const doc = new jsPDF();
    const subject = subjects.find(s => s.id === exam.courseId);
    const examQuestions = questions.filter(q => exam.questions.includes(q.id));

    // Cabeçalho Institucional
    doc.setFontSize(18);
    doc.setTextColor(180, 83, 9); // Amber-800
    doc.text('INSTITUTO DE ENSINO TEOLÓGICO', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(68, 64, 60); // Stone-700
    doc.text(exam.title, 105, 30, { align: 'center' });
    
    doc.setDrawColor(231, 229, 228); // Stone-200
    doc.line(20, 35, 190, 35);

    // Campos do Aluno
    doc.setFontSize(10);
    doc.text(`Disciplina: ${subject?.name || 'Geral'}`, 20, 45);
    doc.text(`Data: ____/____/____`, 140, 45);
    doc.text(`Nome do Aluno: _______________________________________________________`, 20, 55);
    doc.text(`Nota: ________`, 170, 55);
    
    doc.line(20, 60, 190, 60);

    // Questões
    let y = 75;
    examQuestions.forEach((q, idx) => {
      // Verificar quebra de página
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${q.text}`, 20, y, { maxWidth: 170 });
      y += (doc.splitTextToSize(q.text, 170).length * 5) + 5;

      doc.setFont('helvetica', 'normal');
      q.options.forEach((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        doc.text(`(  ) ${letter}) ${opt}`, 25, y, { maxWidth: 160 });
        y += 7;
      });
      y += 5;
    });

    // Gabarito em nova página
    doc.addPage();
    doc.setFontSize(14);
    doc.text('GABARITO OFICIAL', 105, 20, { align: 'center' });
    doc.line(20, 25, 190, 25);
    
    y = 40;
    examQuestions.forEach((q, idx) => {
      const correctLetter = String.fromCharCode(65 + q.correctOptionIndex);
      doc.text(`${idx + 1}: [ ${correctLetter} ]`, 20, y);
      y += 10;
    });

    doc.save(`Prova_${exam.title.replace(/\s+/g, '_')}.pdf`);
  };


  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.courseId) return;
    const { error } = await supabase.from('exams').insert([{
      title: newExam.title,
      subject_id: newExam.courseId,
      questions: newExam.questions,
      duration_minutes: newExam.durationMinutes,
      active: newExam.active
    }]);
    
    if (error) handleSupabaseError(error, OperationType.CREATE, 'exams');
    else setIsCreatingExam(false);
  };

  const filteredQuestionsForDraft = questions.filter(q => 
    !newExam.courseId || q.subject_id === newExam.courseId
  ).filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Provas e Avaliações</h2>
          <p className="text-stone-500 italic serif">Gestão de avaliações e exportação profissional</p>
        </div>
        {(user?.role === 'master' || user?.role === 'teacher') && (
          <button 
            onClick={() => setIsCreatingExam(true)}
            className="bg-[#B45309] text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-900/10 hover:scale-[1.02] transition-all font-bold"
          >
            <Plus size={20} /> Criar Nova Prova
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreatingExam && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 space-y-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Título da Avaliação</label>
                <input 
                  className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-medium"
                  placeholder="Ex: Avaliação Bimestral - Pentateuco"
                  value={newExam.title}
                  onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Disciplina</label>
                <select 
                  className="w-full p-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-medium"
                  value={newExam.courseId}
                  onChange={e => setNewExam({ ...newExam, courseId: e.target.value })}
                >
                  <option value="">Selecione a disciplina...</option>
                  {subjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                   Selecionar Questões ({newExam.questions?.length || 0})
                 </label>
                 <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                   <input 
                     className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-100 text-xs outline-none focus:border-amber-300 transition-all"
                     placeholder="Filtrar por texto..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-4 bg-stone-50/50 rounded-3xl border border-stone-100 custom-scrollbar">
                {filteredQuestionsForDraft.length > 0 ? (
                  filteredQuestionsForDraft.map(q => {
                    const isSelected = newExam.questions?.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          const current = newExam.questions || [];
                          if (current.includes(q.id)) setNewExam({ ...newExam, questions: current.filter(id => id !== q.id) });
                          else setNewExam({ ...newExam, questions: [...current, q.id] });
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${
                          isSelected ? 'bg-white border-amber-500 shadow-md shadow-amber-900/5' : 'bg-white/50 border-stone-100 hover:border-stone-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-stone-300'}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium leading-relaxed ${isSelected ? 'text-stone-900' : 'text-stone-600'}`}>{q.text}</p>
                          <div className="flex gap-2 mt-2">
                             <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{q.category}</span>
                             {subjects.find(s => s.id === q.subject_id) && (
                               <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                 {subjects.find(s => s.id === q.subject_id)?.name}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-stone-400 italic text-sm">
                    {newExam.courseId ? 'Nenhuma questão encontrada para esta disciplina.' : 'Selecione uma disciplina para filtrar as questões.'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleCreateExam} 
                disabled={!newExam.title || !newExam.courseId || (newExam.questions?.length || 0) === 0}
                className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-stone-800 disabled:opacity-50 disabled:grayscale transition-all"
              >
                Publicar e Salvar Avaliação
              </button>
              <button 
                onClick={() => setIsCreatingExam(false)} 
                className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {exams.map(exam => (
            <motion.div 
              key={exam.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl border border-stone-200/50 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 relative z-10 flex justify-end">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  exam.active 
                    ? 'bg-green-50 text-green-600 border border-green-100' 
                    : 'bg-stone-50 text-stone-400 border border-stone-100'
                }`}>
                  {exam.active ? 'Ativa' : 'Encerrada'}
                </span>
              </div>
              
              <div className="mt-2 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center mb-4">
                  <GraduationCap size={24} />
                </div>
                <h4 className="text-xl font-bold text-stone-900 leading-tight group-hover:text-[var(--color-primary-600)] transition-colors">{exam.title}</h4>
                <p className="text-xs text-stone-400 font-medium mt-1 uppercase tracking-wider">{subjects.find(s => s.id === exam.courseId)?.name || 'Disciplina Geral'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100/50">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Duração</p>
                  <p className="text-sm font-bold text-stone-700 flex items-center gap-1.5"><Clock size={14} className="text-[var(--color-primary-500)]" /> {exam.durationMinutes} min</p>
                </div>
                <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100/50">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Questões</p>
                  <p className="text-sm font-bold text-stone-700 flex items-center gap-1.5"><FileText size={14} className="text-[var(--color-primary-500)]" /> {exam.questions.length} itens</p>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-stone-900 text-white font-bold text-sm shadow-xl shadow-stone-900/10 hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
              >
                {user?.role === 'student' ? 'Iniciar Avaliação' : 'Ver Resultados'}
                <ArrowRight size={16} />
              </motion.button>
              
              {(user?.role === 'master' || user?.role === 'teacher') && (
                <button 
                  onClick={() => generateExamPDF(exam)}
                  className="w-full mt-3 py-3 rounded-2xl bg-white text-stone-600 font-bold text-sm border border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Imprimir PDF
                </button>
              )}
            </motion.div>

          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Finances View ---
const FinancesView = () => {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: 'income', amount: 0, description: '' });
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFinances = async () => {
      let query = supabase.from('finances').select('*');
      if (user?.role !== 'master') {
         query = query.eq('student_id', user?.uid);
      }
      const { data, error } = await query;
      if (error) handleSupabaseError(error, OperationType.GET, 'finances');
      else setRecords(data || []);
    };
    fetchFinances();
  }, [user]);

  const handleAdd = async () => {
    if (!newRecord.amount) return;
    const { error } = await supabase.from('finances').insert([{
      ...newRecord,
      student_id: user?.uid,
      date: new Date().toISOString()
    }]);

    if (error) handleSupabaseError(error, OperationType.CREATE, 'finances');
    else setIsAdding(false);
  };

  const filteredRecords = records.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalIncome = filteredRecords.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
  const totalExpense = filteredRecords.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório Financeiro', 14, 15);
    const tableData = filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => [
      format(new Date(r.date), 'dd/MM/yyyy'),
      r.description,
      r.type === 'income' ? 'Entrada' : 'Saída',
      `R$ ${r.amount.toFixed(2)}`
    ]);
    (doc as any).autoTable({
      head: [['Data', 'Descrição', 'Tipo', 'Valor']],
      body: tableData,
      startY: 20,
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Entradas: R$ ${totalIncome.toFixed(2)}`, 14, finalY);
    doc.text(`Total Saídas: R$ ${totalExpense.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Saldo Líquido: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 14, finalY + 14);
    doc.save('relatorio_financeiro.pdf');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Gestão Financeira</h2>
          <p className="text-stone-500 italic serif">Painel de controle de tesouraria</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl hover:bg-stone-200 transition-all font-bold border border-stone-200"
          >
            <Download size={20} /> Relatório PDF
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-stone-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10"
          >
            <Plus size={20} /> Novo Lançamento
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-card p-8 rounded-[32px] border border-green-100 shadow-xl shadow-green-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Total Entradas</p>
          <p className="text-4xl font-bold text-green-600 tracking-tight">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-green-500 text-sm font-bold">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">↑</div>
            Fluxo positivo
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-card p-8 rounded-[32px] border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Total Saídas</p>
          <p className="text-4xl font-bold text-red-500 tracking-tight">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-bold">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">↓</div>
            Gastos operacionais
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-stone-900 p-8 rounded-[32px] border border-stone-800 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-500)]/20 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">Saldo Líquido</p>
          <p className="text-4xl font-bold text-white tracking-tight">R$ {(totalIncome - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-stone-400 text-sm font-bold">
            <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center">≋</div>
            Saldo em conta
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-[var(--color-primary-500)]/10 outline-none bg-white shadow-sm transition-all"
            placeholder="Buscar transação por descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-6 py-4 rounded-2xl border border-stone-200 outline-none bg-white font-bold text-stone-600 appearance-none min-w-[180px] shadow-sm cursor-pointer hover:border-stone-300 transition-all"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">Todas as Datas</option>
            <option value="income">Entradas (+)</option>
            <option value="expense">Saídas (-)</option>
          </select>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-primary-500)] shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              className="p-3 rounded-xl border border-stone-200 outline-none"
              value={newRecord.type}
              onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}
            >
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
            <input 
              type="number"
              className="p-3 rounded-xl border border-stone-200 outline-none"
              placeholder="Valor (R$)"
              onChange={e => setNewRecord({ ...newRecord, amount: parseFloat(e.target.value) })}
            />
            <input 
              className="p-3 rounded-xl border border-stone-200 outline-none"
              placeholder="Descrição"
              onChange={e => setNewRecord({ ...newRecord, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-bold">Salvar</button>
            <button onClick={() => setIsAdding(false)} className="bg-stone-100 text-stone-600 px-6 py-2 rounded-xl font-bold">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Descrição</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
              <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 text-stone-500 text-sm">{format(new Date(record.date), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 font-medium text-stone-900">{record.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${record.type === 'income' ? 'text-[var(--color-primary-600)] text-[var(--color-primary-600)]' : 'bg-red-100 text-red-700'}`}>
                    {record.type === 'income' ? 'Entrada' : 'Saída'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${record.type === 'income' ? 'text-[var(--color-primary-600)]' : 'text-red-500'}`}>
                  {record.type === 'income' ? '+' : '-'} R$ {record.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [isEnrollMode, setIsEnrollMode] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthContext.Consumer>
          {({ user, loading }) => {
            if (loading) return (
              <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 text-[var(--color-primary-600)]"></div>
              </div>
            );
            if (!user) {
              return showLogin ? (
                <LoginView 
                  onBack={() => { setShowLogin(false); setIsEnrollMode(false); }}
                  initialIsSignUp={isEnrollMode}
                />
              ) : (
                <LandingPage 
                  onLoginClick={() => { setShowLogin(true); setIsEnrollMode(false); }} 
                  onEnrollClick={() => { setShowLogin(true); setIsEnrollMode(true); }}
                />
              );
            }

            return (
              <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'subjects' && <SubjectsView />}
                {activeTab === 'attendance' && <AttendanceView />}
                {activeTab === 'enrollment' && <EnrollmentView />}
                {activeTab === 'students' && <StudentsView />}
                {activeTab === 'teachers' && <TeachersView />}
                {activeTab === 'finances' && <FinancesView />}
                {activeTab === 'questions' && <QuestionBankView />}
                {activeTab === 'exams' && <ExamsView />}
                {activeTab === 'results' && <ResultsView />}
              </Layout>
            );
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    </ErrorBoundary>
  );
}
