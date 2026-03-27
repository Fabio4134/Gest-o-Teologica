import React, { useContext } from 'react';
import { BookOpen, User, FileText, ClipboardList, Building2, Target, Award, ArrowRight } from 'lucide-react';
import { TenantContext } from '../theme/TenantContext';

interface LandingPageProps {
  onLoginClick: () => void;
  onEnrollClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onEnrollClick }) => {
  const { tenant } = useContext(TenantContext);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Navbar */}
      <nav className="bg-[var(--color-primary-900)] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center z-50 relative border-b-4 border-[var(--color-primary-700)]">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
             {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
                <Building2 size={24} className="text-[var(--color-primary-900)]" />
             )}
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-widest uppercase">
              IBAD(Instituto Bíblico Das Assembléias de Deus) - Núcleo Cosme de Fárias
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onLoginClick}
            className="border border-white/30 hover:bg-white/10 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <User size={16} /> Painel do Professor
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-gradient-to-br from-[var(--color-primary-900)] to-[#2e1065] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-[var(--color-primary-900)]/50">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary-500)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-6">

              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                IBAD(Instituto Bíblico Das Assembléias de Deus) - <span className="text-[var(--color-primary-400)]">Núcleo Cosme de Fárias</span>
              </h2>

            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-64 h-64 md:w-80 md:h-80 relative">
                <div className="absolute inset-0 bg-[var(--color-primary-500)]/20 rounded-full blur-2xl animate-pulse"></div>
                {tenant.logoUrl ? (
                   <img src={tenant.logoUrl} alt="Brasão" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                ) : (
                   <div className="w-full h-full bg-[var(--color-primary-900)] rounded-full border-4 border-[var(--color-primary-500)] flex items-center justify-center relative z-10 shadow-2xl">
                     <Award size={80} className="text-[var(--color-primary-500)]" />
                   </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div 
            onClick={onEnrollClick}
            className="bg-[var(--color-primary-600)] text-white p-6 rounded-2xl shadow-lg border border-[var(--color-primary-700)] hover:-translate-y-1 transition-transform cursor-pointer group"
          >
            <ClipboardList size={28} className="mb-4 text-violet-200 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-1">Fazer Matrícula</h3>
            <p className="text-sm text-violet-100 opacity-90">Inscreva-se agora e comece sua formação teológica</p>
          </div>
          
          <div 
            onClick={onLoginClick}
            className="bg-white p-6 rounded-2xl shadow-md border border-stone-100 hover:-translate-y-1 hover:border-[var(--color-primary-500)]/30 transition-all cursor-pointer group"
          >
            <BookOpen size={28} className="mb-4 text-stone-600 group-hover:text-[var(--color-primary-600)] transition-colors" />
            <h3 className="font-bold text-stone-900 text-lg mb-1 group-hover:text-[var(--color-primary-600)] transition-colors">Realizar Prova</h3>
            <p className="text-sm text-stone-500">Faça login com e-mail e senha para ter acesso e executar suas avaliações.</p>
          </div>
          
          <div 
            onClick={onLoginClick}
            className="bg-white p-6 rounded-2xl shadow-md border border-stone-100 hover:-translate-y-1 hover:border-[var(--color-primary-500)]/30 transition-all cursor-pointer group"
          >
            <User size={28} className="mb-4 text-stone-600 group-hover:text-[var(--color-primary-600)] transition-colors" />
            <h3 className="font-bold text-stone-900 text-lg mb-1 group-hover:text-[var(--color-primary-600)] transition-colors">Área do Aluno</h3>
            <p className="text-sm text-stone-500">Acesse sua plataforma para gestão financeira, resultados, agenda e material.</p>
          </div>
          
          <div 
            onClick={onLoginClick}
            className="bg-white p-6 rounded-2xl shadow-md border border-stone-100 hover:-translate-y-1 hover:border-stone-300 transition-all cursor-pointer group"
          >
            <Award size={28} className="mb-4 text-stone-600 group-hover:text-[var(--color-primary-600)] transition-colors" />
            <h3 className="font-bold text-stone-900 text-lg mb-1">Ver meu resultado</h3>
            <p className="text-sm text-stone-500">Faça login para acessar os resultados da sua última prova realizada.</p>
          </div>
        </div>



      </div>
    </div>
  );
};
