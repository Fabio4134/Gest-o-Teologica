import React, { useContext, useState, useEffect } from 'react';
import { AuthProvider, AuthContext, LoginView } from './components/Auth';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { supabase } from './supabaseClient';
import { UserProfile, Course, StudentDetails, Attendance, Question, Exam, ExamResult, FinancialRecord, TeacherDetails } from './types';
import { LogIn, LogOut, GraduationCap, BookOpen, Users, ClipboardCheck, FileText, DollarSign, BarChart3, Download, Plus, Trash2, CheckCircle2, XCircle, Search, Filter, Clock, Calendar, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
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
    { name: 'Cursos', value: stats.courses },
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
        <StatCard icon={BookOpen} label="Cursos Ativos" value={stats.courses} color="bg-[var(--color-primary-500)]" />
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
  const [newSubject, setNewSubject] = useState({ name: '', description: '', teacherId: '' });
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!newSubject.name) return;
    const { error } = await supabase
      .from('subjects')
      .insert([{ 
        name: newSubject.name, 
        description: newSubject.description, 
        teacher_id: user?.uid 
      }]);
    
    if (error) handleSupabaseError(error, OperationType.CREATE, 'subjects');
    else {
      setIsAdding(false);
      setNewSubject({ name: '', description: '', teacherId: '' });
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
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {modal.show && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 mb-2">{modal.title}</h3>
            <p className="text-stone-500 mb-6">{modal.message}</p>
            <div className="flex gap-3">
              {modal.type === 'confirm' && (
                <button 
                  onClick={() => { modal.onConfirm?.(); setModal({ ...modal, show: false }); }}
                  className="flex-1 bg-[var(--color-primary-600)] text-white py-2 rounded-xl font-bold text-[var(--color-primary-600)] transition-all"
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Disciplinas</h2>
          <p className="text-stone-500 italic serif">Gerencie as disciplinas do curso</p>
        </div>
        {user?.role === 'master' && (
          <div className="flex gap-2">
            <button 
              onClick={importStandardSubjects}
              className="flex items-center gap-2 bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-200 transition-all font-bold"
            >
              <Download size={20} /> Importar Padrão
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-xl text-[var(--color-primary-600)] transition-all shadow-lg shadow-[var(--color-primary-500)]/20"
            >
              <Plus size={20} /> Nova Disciplina
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
          placeholder="Buscar disciplinas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-primary-500)] shadow-sm space-y-4">
          <input 
            className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
            placeholder="Nome da Disciplina"
            value={newSubject.name}
            onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
          />
          <textarea 
            className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
            placeholder="Descrição"
            value={newSubject.description}
            onChange={e => setNewSubject({ ...newSubject, description: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-medium">Salvar</button>
            <button onClick={() => setIsAdding(false)} className="bg-stone-100 text-stone-600 px-6 py-2 rounded-xl font-medium">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSubjects.map(subject => (
          <div key={subject.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-[var(--color-primary-600)] transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 group-hover:text-[var(--color-primary-600)] group-hover:text-[var(--color-primary-600)] transition-colors">
                <BookOpen size={24} />
              </div>
              {user?.role === 'master' && (
                <button onClick={async () => {
                  const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
                  if (error) handleSupabaseError(error, OperationType.DELETE, 'subjects');
                }} className="text-stone-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">{subject.name}</h4>
            <p className="text-sm text-stone-500 line-clamp-3 mb-4">{subject.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Enrollment View ---
const EnrollmentView = () => {
  const [feedback, setFeedback] = useState('');
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;

    // In Supabase, we usually create the user via Auth first, 
    // but for enrollment by an admin, we might need a different flow 
    // or just insert into public.users if they will log in later.
    // For now, let's assume we are just creating the public profiles.
    
    // Generate a temporary ID if we don't have one (though usually it comes from auth)
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

    setFeedback('Matrícula realizada com sucesso!');
    setTimeout(() => setFeedback(''), 3000);
    e.currentTarget.reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {feedback && (
        <div className="text-[var(--color-primary-600)] text-[var(--color-primary-600)] p-4 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} /> {feedback}
        </div>
      )}
      <header>
        <h2 className="text-2xl font-bold text-stone-900">Nova Matrícula</h2>
        <p className="text-stone-500 italic serif">Cadastre um novo aluno no sistema</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Nome Completo</label>
              <input name="displayName" required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Email</label>
              <input name="email" type="email" required className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Telefone</label>
              <input name="phone" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">CPF</label>
              <input name="cpf" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Data de Nascimento</label>
              <input name="birthDate" type="date" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Igreja</label>
              <input name="church" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Endereço</label>
              <input name="address" className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-[var(--color-primary-600)] text-white py-4 rounded-xl font-bold text-[var(--color-primary-600)] transition-all shadow-lg shadow-[var(--color-primary-500)]/20">
            Confirmar Matrícula
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Question Bank View ---
const QuestionBankView = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, category: 'Geral' });

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase.from('questions').select('*');
      if (error) handleSupabaseError(error, OperationType.GET, 'questions');
      else setQuestions(data || []);
    };
    fetchQuestions();

    const channel = supabase
      .channel('questions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        fetchQuestions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async () => {
    if (!newQuestion.text) return;
    const { error } = await supabase.from('questions').insert([newQuestion]);
    if (error) handleSupabaseError(error, OperationType.CREATE, 'questions');
    else {
      setIsAdding(false);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, category: 'Geral' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Banco de Questões</h2>
          <p className="text-stone-500 italic serif">Repositório de perguntas para avaliações</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={20} /> Nova Questão
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-primary-500)] shadow-xl space-y-4">
          <textarea 
            className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            placeholder="Texto da Questão"
            value={newQuestion.text}
            onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newQuestion.options?.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="radio" 
                  name="correct" 
                  checked={newQuestion.correctOptionIndex === idx}
                  onChange={() => setNewQuestion({ ...newQuestion, correctOptionIndex: idx })}
                />
                <input 
                  className="flex-1 p-2 rounded-lg border border-stone-200 outline-none"
                  placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={e => {
                    const opts = [...(newQuestion.options || [])];
                    opts[idx] = e.target.value;
                    setNewQuestion({ ...newQuestion, options: opts });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[var(--color-primary-600)] text-white px-6 py-2 rounded-xl font-bold">Salvar</button>
            <button onClick={() => setIsAdding(false)} className="bg-stone-100 text-stone-600 px-6 py-2 rounded-xl font-bold">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-stone-200 flex justify-between items-start">
            <div>
              <p className="font-bold text-stone-900 mb-2">{q.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {q.options.map((opt, idx) => (
                  <p key={idx} className={`text-sm ${idx === q.correctOptionIndex ? 'text-[var(--color-primary-600)] font-bold' : 'text-stone-500'}`}>
                    {String.fromCharCode(65 + idx)}) {opt}
                  </p>
                ))}
              </div>
            </div>
            <button onClick={async () => {
              const { error } = await supabase.from('questions').delete().eq('id', q.id);
              if (error) handleSupabaseError(error, OperationType.DELETE, 'questions');
            }} className="text-stone-300 hover:text-red-500">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
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
        // Results
        let resultsQuery = supabase.from('exam_results').select('*');
        if (user?.role === 'student') {
          resultsQuery = resultsQuery.eq('student_id', user.uid);
        }
        const { data: resData } = await resultsQuery;
        setResults(resData || []);

        // Exams
        const { data: exData } = await supabase.from('exams').select('*');
        const eMap: Record<string, Exam> = {};
        exData?.forEach(d => eMap[d.id] = d as Exam);
        setExams(eMap);

        // Users
        let usersQuery = supabase.from('users').select('*');
        if (user?.role === 'student') {
          usersQuery = usersQuery.eq('id', user.uid);
        }
        const { data: uData } = await usersQuery;
        const uMap: Record<string, UserProfile> = {};
        uData?.forEach(d => uMap[d.id] = {
          uid: d.id,
          displayName: d.display_name,
          email: d.email,
          role: d.role,
          createdAt: d.created_at,
          photoURL: d.photo_url
        } as UserProfile);
        setStudents(uMap);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'results_data');
      }
    };

    fetchData();
  }, [user]);

  const filteredResults = results.filter(r => {
    const studentName = students[r.studentId]?.displayName || '';
    const examTitle = exams[r.examId]?.title || '';
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           examTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Resultados', 14, 15);
    const tableData = filteredResults.map(r => [
      students[r.studentId]?.displayName || '---',
      exams[r.examId]?.title || '---',
      format(new Date(r.completedAt), 'dd/MM/yyyy HH:mm'),
      r.score.toFixed(1)
    ]);
    (doc as any).autoTable({
      head: [['Aluno', 'Prova', 'Data', 'Nota']],
      body: tableData,
      startY: 20,
    });
    doc.save('relatorio_resultados.pdf');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Resultados de Provas</h2>
          <p className="text-stone-500 italic serif">Desempenho acadêmico dos alunos</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-200 transition-all font-bold"
        >
          <Download size={20} /> PDF
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
          placeholder="Buscar por aluno ou prova..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Aluno</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Prova</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase text-right">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredResults.map(result => (
              <tr key={result.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-900">{students[result.studentId]?.displayName || '---'}</td>
                <td className="px-6 py-4 text-stone-600">{exams[result.examId]?.title || '---'}</td>
                <td className="px-6 py-4 text-stone-500 text-sm">{format(new Date(result.completedAt), 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${result.score >= 7 ? 'text-[var(--color-primary-600)]' : 'text-red-500'}`}>
                    {result.score.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// --- Students View ---
const StudentsView = () => {
  const { user: currentUser } = useContext(AuthContext);
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
      studentDetails[s.uid]?.status === 'active' ? 'Ativo' : studentDetails[s.uid]?.status === 'graduated' ? 'Formado' : 'Inativo'
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
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
          placeholder="Buscar aluno por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-bottom border-stone-200">
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Aluno</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Contato</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Matrícula</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(student => {
              const details = studentDetails[student.uid];
              return (
                <tr key={student.uid} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full text-[var(--color-primary-600)] flex items-center justify-center font-bold text-[var(--color-primary-600)]">
                        {student.displayName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{student.displayName}</p>
                        <p className="text-xs text-stone-400">{details?.church || 'Igreja não informada'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-stone-600">{student.email}</p>
                    <p className="text-xs text-stone-400">{details?.phone || 'Sem telefone'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-stone-500">{details?.registrationNumber || '---'}</p>
                    <p className="text-[10px] text-stone-400 uppercase">{details?.enrollmentDate ? format(new Date(details.enrollmentDate), 'dd/MM/yyyy') : '---'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      details?.status === 'active' ? 'text-[var(--color-primary-600)] text-[var(--color-primary-600)]' : 
                      details?.status === 'graduated' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {details?.status === 'active' ? 'Ativo' : details?.status === 'graduated' ? 'Formado' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingStudent({ user: student, details: details || {} as StudentDetails })}
                        className="p-2 text-stone-400 text-[var(--color-primary-600)] transition-colors"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.uid)}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Teachers View ---
const TeachersView = () => {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [teacherDetails, setTeacherDetails] = useState<Record<string, TeacherDetails>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<{ user: UserProfile, details: TeacherDetails } | null>(null);

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
          <h2 className="text-2xl font-bold text-stone-900">Registro de Professores</h2>
          <p className="text-stone-500 italic serif">Corpo docente e currículos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-all"
        >
          <Plus size={20} /> Novo Professor
        </button>
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
        {teachers.map(teacher => {
          const details = teacherDetails[teacher.uid];
          return (
            <div key={teacher.uid} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex gap-6 items-start">
              <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                <Users size={40} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-stone-900">{teacher.displayName}</h4>
                    <p className="text-sm text-[var(--color-primary-600)] font-medium">{details?.specialization || 'Professor'}</p>
                  </div>
                  <button 
                    onClick={() => setEditingTeacher({ user: teacher, details: details || {} as TeacherDetails })}
                    className="text-stone-300 hover:text-stone-600"
                  >
                    <FileText size={18} />
                  </button>
                </div>
                <p className="text-sm text-stone-500 line-clamp-2 italic serif">{details?.bio || 'Sem biografia informada.'}</p>
                <div className="flex gap-4 pt-2">
                  <div className="text-xs text-stone-400 flex items-center gap-1"><FileText size={12} /> {teacher.email}</div>
                  {details?.phone && <div className="text-xs text-stone-400 flex items-center gap-1"><Users size={12} /> {details.phone}</div>}
                </div>
              </div>
            </div>
          );
        })}
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
      setLessonTopic('Chamada salva com sucesso!');
      setTimeout(() => {
        setLessonTopic('');
        setPresentIds([]);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-stone-900">Chamada Online</h2>
        <p className="text-stone-500 italic serif">Registro diário de presença por aula</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Selecione a Disciplina</label>
            <select 
              className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="">Selecione...</option>
              {subjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tópico da Aula / Lição</label>
            <input 
              className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              placeholder="Ex: Introdução ao Pentateuco"
              value={lessonTopic}
              onChange={e => setLessonTopic(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={!selectedSubject || !lessonTopic}
            className="bg-[var(--color-primary-600)] text-white px-8 py-3 rounded-xl font-bold text-[var(--color-primary-600)] disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary-500)]/20"
          >
            Finalizar Chamada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => (
          <button
            key={student.uid}
            onClick={() => {
              if (presentIds.includes(student.uid)) setPresentIds(presentIds.filter(id => id !== student.uid));
              else setPresentIds([...presentIds, student.uid]);
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              presentIds.includes(student.uid) 
                ? 'text-[var(--color-primary-600)] text-[var(--color-primary-600)] text-[var(--color-primary-600)]' 
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${presentIds.includes(student.uid) ? 'text-[var(--color-primary-600)]' : 'bg-stone-100'}`}>
                {student.displayName[0]}
              </div>
              <span className="font-medium">{student.displayName}</span>
            </div>
            {presentIds.includes(student.uid) ? <CheckCircle2 className="text-[var(--color-primary-600)]" /> : <XCircle className="text-stone-300" />}
          </button>
        ))}
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: qData } = await supabase.from('questions').select('*');
        setQuestions(qData || []);
        
        const { data: exData } = await supabase.from('exams').select('*');
        setExams(exData || []);
        
        const { data: sData } = await supabase.from('subjects').select('*');
        setSubjects(sData || []);
      } catch (err) {
        handleSupabaseError(err, OperationType.GET, 'exams_initial_data');
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Provas e Avaliações</h2>
          <p className="text-stone-500 italic serif">Banco de questões e execução online</p>
        </div>
        {(user?.role === 'master' || user?.role === 'teacher') && (
          <button 
            onClick={() => setIsCreatingExam(true)}
            className="bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-[var(--color-primary-600)] transition-all"
          >
            <Plus size={20} /> Criar Prova
          </button>
        )}
      </div>

      {isCreatingExam && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-[var(--color-primary-500)] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Título da Prova</label>
              <input 
                className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                placeholder="Ex: Avaliação Final - Teologia Sistemática"
                value={newExam.title}
                onChange={e => setNewExam({ ...newExam, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Disciplina</label>
              <select 
                className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                value={newExam.courseId}
                onChange={e => setNewExam({ ...newExam, courseId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {subjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Selecionar Questões do Banco ({newExam.questions?.length || 0})</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-auto p-2 border border-stone-100 rounded-xl">
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => {
                    const current = newExam.questions || [];
                    if (current.includes(q.id)) setNewExam({ ...newExam, questions: current.filter(id => id !== q.id) });
                    else setNewExam({ ...newExam, questions: [...current, q.id] });
                  }}
                  className={`p-3 text-left rounded-xl border text-sm transition-all ${
                    newExam.questions?.includes(q.id) ? 'text-[var(--color-primary-600)] text-[var(--color-primary-600)] text-[var(--color-primary-600)]' : 'bg-white border-stone-100 text-stone-600'
                  }`}
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCreateExam} className="bg-[var(--color-primary-600)] text-white px-8 py-3 rounded-xl font-bold">Publicar Prova</button>
            <button onClick={() => setIsCreatingExam(false)} className="bg-stone-100 text-stone-600 px-8 py-3 rounded-xl font-bold">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className={`px-2 py-1 rounded-bl-xl text-[10px] font-bold uppercase ${exam.active ? 'text-[var(--color-primary-600)] text-[var(--color-primary-600)]' : 'bg-stone-100 text-stone-500'}`}>
                {exam.active ? 'Ativa' : 'Encerrada'}
              </span>
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2 pr-12">{exam.title}</h4>
            <div className="flex items-center gap-4 text-sm text-stone-500 mb-6">
              <span className="flex items-center gap-1"><Clock size={14} /> {exam.durationMinutes} min</span>
              <span className="flex items-center gap-1"><FileText size={14} /> {exam.questions.length} questões</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-stone-900 text-white font-bold text-[var(--color-primary-600)] transition-all">
              {user?.role === 'student' ? 'Iniciar Prova' : 'Ver Resultados'}
            </button>
          </div>
        ))}
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Gestão Financeira</h2>
          <p className="text-stone-500 italic serif">Controle de entradas e saídas</p>
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
            className="bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={20} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Entradas</p>
          <p className="text-2xl font-bold text-[var(--color-primary-600)]">R$ {totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Saídas</p>
          <p className="text-2xl font-bold text-red-500">R$ {totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Saldo Líquido</p>
          <p className="text-2xl font-bold text-white">R$ {(totalIncome - totalExpense).toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="p-3 rounded-2xl border border-stone-200 outline-none bg-white min-w-[150px]"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">Todos os Tipos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>
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
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

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
                <LoginView onBack={() => setShowLogin(false)} />
              ) : (
                <LandingPage onLoginClick={() => setShowLogin(true)} />
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
