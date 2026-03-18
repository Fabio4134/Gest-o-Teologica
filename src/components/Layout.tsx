import React from 'react';
import { AuthContext } from './Auth';
import { TenantContext } from '../theme/TenantContext';
import { LogOut, GraduationCap, BookOpen, Users, ClipboardCheck, FileText, DollarSign, BarChart3, Menu, X, Award, CheckCircle2, Building } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = React.useContext(AuthContext);
  const { tenant } = React.useContext(TenantContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['student', 'teacher', 'master'] },
    { 
      id: 'subjects', 
      label: 'Disciplinas', 
      icon: BookOpen, 
      roles: ['student', 'teacher', 'master'],
      subItems: [
        "Cristologia", "Epístolas Paulinas", "Escatologia", "Escola Dominical",
        "Evangelhos e Atos", "Evangelismo", "Evidência Cristã",
        "Fundamentos da Psicologia e do Aconselhamento", "Geografia Bíblica",
        "Hebreus e Epístolas Gerais", "Hermenêutica", "História da Igreja",
        "Homilética", "Introdução ao Novo Testamento", "Introdução Bíblica",
        "Livros Históricos", "Livros Poéticos", "Maneiras e Costumes Bíblicos",
        "Missiologia", "Pentateuco", "Profetas Maiores e Menores",
        "Religiões Comparadas", "Teologia Pastoral", "Teologia Sistemática"
      ]
    },
    { id: 'attendance', label: 'Chamada', icon: CheckCircle2, roles: ['teacher', 'master'] },
    { id: 'enrollment', label: 'Matrícula', icon: Users, roles: ['master', 'teacher'] },
    { id: 'students', label: 'Alunos', icon: Users, roles: ['teacher', 'master'] },
    { id: 'teachers', label: 'Professores', icon: GraduationCap, roles: ['master'] },
    { id: 'finances', label: 'Financeiro', icon: DollarSign, roles: ['master'] },
    { id: 'questions', label: 'Banco de Questões', icon: ClipboardCheck, roles: ['teacher', 'master'] },
    { id: 'exams', label: 'Provas', icon: FileText, roles: ['student', 'teacher', 'master'] },
    { id: 'results', label: 'Resultados', icon: Award, roles: ['student', 'teacher', 'master'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const [expandedItems, setExpandedItems] = React.useState<string[]>(['subjects']);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-stone-50 overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary-100)] opacity-40 blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary-50)] opacity-60 blur-3xl mix-blend-multiply pointer-events-none"></div>

      {/* Sidebar Desktop - Premium Floating Glass style */}
      <aside className="hidden md:flex flex-col w-72 m-4 rounded-3xl glass-dark text-stone-300 p-6 z-10 overflow-hidden relative shadow-2xl border-stone-700">
        <div className="flex items-center gap-3 mb-10 px-2 relative z-10 mt-2">
          {tenant.logoUrl ? (
             <img src={tenant.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          ) : (
             <div className="w-10 h-10 bg-[var(--color-primary-500)]/20 rounded-xl flex items-center justify-center text-[var(--color-primary-500)] shadow-[0_0_15px_var(--color-primary-500)]">
               <Building size={20} />
             </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight leading-tight">{tenant.shortName}</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400">{tenant.name}</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
          {filteredMenu.map(item => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.subItems) toggleExpand(item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 outline-none ${
                  activeTab === item.id 
                    ? 'bg-[var(--color-primary-500)] text-white shadow-lg shadow-[var(--color-primary-500)]/30 font-medium translate-x-1' 
                    : 'hover:bg-white/10 hover:text-white text-stone-400'
                }`}
              >
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                <span className="font-medium tracking-wide">{item.label}</span>
                {item.subItems && (
                  <Menu size={14} className={`ml-auto transition-transform ${expandedItems.includes(item.id) ? 'rotate-90 text-[var(--color-primary-100)]' : ''}`} />
                )}
              </button>
              
              {item.subItems && expandedItems.includes(item.id) && (
                <div className="pl-12 space-y-1 mb-2 mt-2 relative before:absolute before:content-[''] before:left-6 before:top-0 before:bottom-0 before:w-[1px] before:bg-white/10">
                  {item.subItems.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveTab('subjects')}
                      className="w-full text-left py-2 text-sm text-stone-400 hover:text-[var(--color-primary-400)] hover:translate-x-1 transition-all truncate"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3 px-2 mb-4 bg-white/5 p-3 rounded-2xl border border-white/5">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-500)]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-500)]/20 text-[var(--color-primary-400)] flex items-center justify-center font-bold border border-[var(--color-primary-500)]/30">
                {user?.displayName?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-stone-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all text-stone-400 border border-transparent hover:border-red-500/30"
          >
            <LogOut size={18} />
            <span className="font-medium">Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden glass text-stone-900 border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-primary-500)] rounded-lg flex items-center justify-center text-white shadow-md">
            <Building size={16} />
          </div>
          <span className="font-bold text-lg">{tenant.shortName}</span>
        </div>
        <button className="text-stone-600 bg-stone-100 p-2 rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 flex justify-end">
          <div className="bg-white w-4/5 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-6 border-b border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-primary-500)] rounded-xl flex items-center justify-center text-white shadow-md">
                <Building size={20} />
              </div>
              <div>
                <span className="font-bold text-lg text-stone-900 leading-tight">{tenant.shortName}</span>
                <p className="text-xs text-stone-500">{tenant.name}</p>
              </div>
            </div>
            
            <nav className="p-4 space-y-2 overflow-y-auto flex-1">
              {filteredMenu.map(item => (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (item.subItems) {
                        toggleExpand(item.id);
                      } else {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-semibold transition-all ${
                      activeTab === item.id ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'text-stone-600 active:bg-stone-50'
                    }`}
                  >
                    <item.icon size={22} className={activeTab === item.id ? 'text-[var(--color-primary-600)]' : 'text-stone-400'} />
                    {item.label}
                    {item.subItems && (
                      <Menu size={18} className={`ml-auto transition-transform ${expandedItems.includes(item.id) ? 'rotate-90' : ''}`} />
                    )}
                  </button>
                  
                  {item.subItems && expandedItems.includes(item.id) && (
                    <div className="pl-14 space-y-1 pb-2">
                      {item.subItems.map(sub => (
                         <button
                           key={sub}
                           onClick={() => {
                             setActiveTab('subjects');
                             setIsMobileMenuOpen(false);
                           }}
                           className="w-full text-left py-2 text-stone-500 active:text-[var(--color-primary-600)] transition-colors text-sm"
                         >
                           {sub}
                         </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="p-6 border-t border-stone-100 bg-stone-50">
               <button
                 onClick={logout}
                 className="flex items-center justify-center gap-3 w-full bg-white border border-stone-200 px-6 py-4 rounded-2xl text-red-500 font-bold active:bg-red-50"
               >
                 <LogOut size={20} />
                 Sair da Conta
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 w-full h-screen custom-scrollbar">
        <div className="max-w-[1400px] mx-auto h-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
