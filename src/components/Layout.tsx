import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from './Auth';
import { TenantContext } from '../theme/TenantContext';
import { 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  DollarSign, 
  FileText, 
  Award, 
  LogOut, 
  Building,
  Menu,
  X,
  ClipboardCheck
} from 'lucide-react';

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
    { id: 'subjects', label: 'Disciplinas', icon: BookOpen, roles: ['student', 'teacher', 'master'] },
    { id: 'questions', label: 'Banco de Questões', icon: ClipboardCheck, roles: ['teacher', 'master'] },
    { id: 'attendance', label: 'Chamada', icon: CheckCircle2, roles: ['teacher', 'master'] },
    { id: 'enrollment', label: 'Matrícula', icon: Users, roles: ['master', 'teacher'] },
    { id: 'students', label: 'Alunos', icon: Users, roles: ['teacher', 'master'] },
    { id: 'teachers', label: 'Professores', icon: GraduationCap, roles: ['master'] },
    { id: 'finances', label: 'Financeiro', icon: DollarSign, roles: ['master'] },
    { id: 'exams', label: 'Provas', icon: FileText, roles: ['student', 'teacher', 'master'] },
    { id: 'results', label: 'Resultados', icon: Award, roles: ['student', 'teacher', 'master'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['subjects']);

  const toggleMenu = (id: string) => {
    // No-op for now as we don't have sub-items
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-stone-50 overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary-100)] opacity-40 blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary-50)] opacity-60 blur-3xl mix-blend-multiply pointer-events-none"></div>

      {/* Sidebar Desktop - Solid Premium style */}
      <aside className="hidden md:flex flex-col w-72 m-4 rounded-3xl bg-[#1a1625] text-stone-300 p-6 z-10 overflow-hidden relative shadow-2xl border border-white/5">
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
        
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar relative z-10">
          {filteredMenu.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 outline-none relative group ${
                  isActive
                    ? 'text-white font-semibold' 
                    : 'hover:bg-white/5 hover:text-white text-stone-400'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-400)] rounded-2xl shadow-lg shadow-[var(--color-primary-500)]/40"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </span>
              </button>
            );
          })}
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
          <div className="w-8 h-8 bg-[var(--color-primary-500)] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary-500)]/30">
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
              <div className="w-10 h-10 bg-[var(--color-primary-500)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary-500)]/30">
                <Building size={20} />
              </div>
              <div>
                <span className="font-bold text-lg text-stone-900 leading-tight">{tenant.shortName}</span>
                <p className="text-xs text-stone-500">{tenant.name}</p>
              </div>
            </div>
            
            <nav className="p-4 space-y-2 overflow-y-auto flex-1">
              {filteredMenu.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-semibold transition-all ${
                      isActive ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'text-stone-600 active:bg-stone-50'
                    }`}
                  >
                    <Icon size={22} className={isActive ? 'text-[var(--color-primary-600)]' : 'text-stone-400'} />
                    {item.label}
                  </button>
                );
              })}
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
        <div className="max-w-[1400px] mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
