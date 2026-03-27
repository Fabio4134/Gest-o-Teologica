import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { TenantContext } from '../theme/TenantContext';
import { LogIn, GraduationCap, Building, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';

export const AuthContext = React.createContext<{
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}>({ user: null, loading: true, logout: () => { } });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserChange = async (supabaseUser: any) => {
    // Timeout para evitar travamento da UI em conexões lentas ou falhas de RLS
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na requisição Supabase')), 3000)
    );

    try {
      const isMaster = supabaseUser.email === 'fabio.bpereira40@gmail.com';
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id);
      
      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const userData = data?.[0];

      if (userData) {
        setUser(userData as UserProfile);
      } else {
        // Fallback: Criar perfil básico se não existir no DB
        const newUser: UserProfile = {
          uid: supabaseUser.id,
          displayName: supabaseUser.user_metadata?.full_name || 'Usuário',
          email: supabaseUser.email || '',
          role: isMaster ? 'master' : 'student',
          createdAt: new Date().toISOString(),
        };
        setUser(newUser);
      }
    } catch (err: any) {
      console.warn('AuthProvider: Usando fallback para informações do usuário.', err.message);
      if (supabaseUser) {
        setUser({
          uid: supabaseUser.id,
          displayName: supabaseUser.user_metadata?.full_name || 'Usuário (Offline)',
          email: supabaseUser.email || '',
          role: 'student',
          createdAt: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleUserChange(session.user);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await handleUserChange(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoginView = ({ onBack, initialIsSignUp = false }: { onBack?: () => void, initialIsSignUp?: boolean }) => {
  const { tenant, setTenantId, availableTenants } = useContext(TenantContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [church, setChurch] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(initialIsSignUp);
  }, [initialIsSignUp]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName } }
        });
        if (signUpError) throw signUpError;
        setSuccess('Matrícula enviada. Aguarde aprovação.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#2e1065] font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-soft-light filter blur-[120px] opacity-40 animate-blob" style={{ backgroundColor: '#4c1d95' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="backdrop-blur-3xl bg-white/10 border border-white/20 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-10 flex flex-col items-center">
          
          <div className="w-full flex justify-end mb-8 relative z-20">
             <div className="bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/10 flex items-center">
               <Building size={14} className="text-white/40 ml-2" />
               <select className="bg-transparent text-[10px] font-bold text-white/70 outline-none cursor-pointer pl-1 pr-3 py-0.5" value={tenant.id} onChange={(e) => setTenantId(e.target.value)}>
                 {availableTenants.map(t => (
                   <option key={t.id} value={t.id} className="bg-[#2e1065] text-white">{t.shortName}</option>
                 ))}
               </select>
             </div>
          </div>

          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-[#6d28d9] rounded-3xl shadow-2xl flex items-center justify-center mb-6 border border-white/20">
            <GraduationCap size={40} className="text-white" />
          </div>

          <h1 className="text-2xl font-black text-white mb-1 text-center truncate w-full">{tenant.name}</h1>
          <p className="text-red-200/60 text-center mb-8 text-xs font-medium">{isSignUp ? 'Criar Conta' : 'Portal de Acesso'}</p>

          {error && <div className="w-full bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-6 text-red-200 text-xs flex gap-2"><AlertCircle size={16} />{error}</div>}
          {success && <div className="w-full bg-green-500/20 border border-green-500/50 rounded-xl p-3 mb-6 text-green-200 text-xs flex gap-2"><LogIn size={16} />{success}</div>}

          <form onSubmit={handleAuth} className="w-full space-y-4">
            <input type="email" placeholder="E-mail" className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 px-4 outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 px-4 outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl mt-2">
              {isLoading ? '...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 text-violet-400/80 hover:text-violet-400 text-xs font-bold uppercase tracking-widest">
            {isSignUp ? 'Já tem conta? Entre' : 'Não tem conta? Registre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};
