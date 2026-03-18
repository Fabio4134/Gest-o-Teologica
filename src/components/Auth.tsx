import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { TenantContext } from '../theme/TenantContext';
import { LogIn, GraduationCap, Building, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';

export const AuthContext = React.createContext<{
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}>({ user: null, loading: true, logout: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
         await handleUserChange(session.user);
      } else {
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

  const handleUserChange = async (supabaseUser: any) => {
    try {
      // Fetch public user profile
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (userData) {
        // Master override logic
        if (supabaseUser.email === 'fabio.bpereira40@gmail.com' && userData.role !== 'master') {
          const { data: updatedData } = await supabase
            .from('users')
            .update({ role: 'master' })
            .eq('id', supabaseUser.id)
            .select()
            .single();
          setUser(updatedData as UserProfile);
        } else {
          setUser(userData as UserProfile);
        }
      } else {
        // Create profile if missing
        const isMaster = supabaseUser.email === 'fabio.bpereira40@gmail.com';
        const newUser: UserProfile = {
          uid: supabaseUser.id,
          displayName: supabaseUser.user_metadata?.full_name || 'Usuário',
          email: supabaseUser.email || '',
          role: isMaster ? 'master' : 'student',
          createdAt: new Date().toISOString(),
          photoURL: supabaseUser.user_metadata?.avatar_url || undefined,
        };

        const { data: createdUser, error: insertError } = await supabase
          .from('users')
          .insert([{ 
            id: newUser.uid,
            display_name: newUser.displayName,
            email: newUser.email,
            role: newUser.role,
            photo_url: newUser.photoURL,
            created_at: newUser.createdAt
          }])
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          setUser(newUser);
        }
      }
    } catch (err) {
      console.error('Error handling user change:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoginView = ({ onBack }: { onBack?: () => void }) => {
  const { tenant, setTenantId, availableTenants } = useContext(TenantContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError('Falha ao entrar com Google. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Email:', error);
      setError('E-mail ou senha incorretos ou erro de conexão.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#450a0a] font-sans">
      {/* Premium Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-soft-light filter blur-[120px] opacity-40 animate-blob"
          style={{ backgroundColor: '#5c1010' }}
        ></div>
        <div 
          className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-30 animate-blob animation-delay-2000"
          style={{ backgroundColor: '#b45309' }}
        ></div>
        <div 
          className="absolute -bottom-[20%] left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-soft-light filter blur-[150px] opacity-40 animate-blob animation-delay-4000"
          style={{ backgroundColor: '#7f1d1d' }}
        ></div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="backdrop-blur-3xl bg-white/10 border border-white/20 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center relative overflow-hidden">
          
          {/* Back Button */}
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-8 left-8 text-white/50 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium z-20"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}

          {/* Tenant Selector */}
          <div className="w-full flex justify-end mb-8 relative z-20">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/10 flex items-center">
              <Building size={14} className="text-white/40 ml-2" />
              <select 
                className="bg-transparent text-[10px] font-bold text-white/70 outline-none cursor-pointer pl-1 pr-3 py-0.5 appearance-none"
                value={tenant.id}
                onChange={(e) => setTenantId(e.target.value)}
              >
                {availableTenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#450a0a] text-white underline-none">{t.shortName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Logo & Branding */}
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-[#b45309] rounded-3xl shadow-2xl flex items-center justify-center mb-6 transform transition-transform duration-700 hover:scale-110 hover:rotate-6 border border-white/20 relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-md"></div>
            {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt="Logo" className="w-12 h-12 object-contain relative z-10" />
            ) : (
                <GraduationCap size={40} className="text-white relative z-10" />
            )}
          </div>
          
          <h1 className="text-2xl font-black text-white mb-1 text-center tracking-tight leading-none">
            {tenant.name}
          </h1>
          <p className="text-red-200/60 text-center mb-8 text-xs font-medium">
            Painel de Acesso Institucional
          </p>

          {error && (
            <div className="w-full bg-red-500/20 border border-red-500/50 backdrop-blur-md rounded-xl p-3 mb-6 flex items-center gap-3 text-red-200 text-xs animate-shake">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Direct Login Form */}
          <form onSubmit={handleEmailLogin} className="w-full space-y-4 relative z-10">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-white/30 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm placeholder:text-white/20 font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-white/30 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm placeholder:text-white/20 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-6">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">ou</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          {/* Social Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-sm transition-all"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="text-[#4285F4]"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="text-[#34A853]"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="text-[#FBBC05]"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="text-[#EA4335]"/>
              </svg>
            </div>
            <span>Acessar com Google</span>
          </button>

          <p className="mt-8 text-[10px] text-white/30 text-center uppercase tracking-widest font-bold">
            Portal Acadêmico • Versão 2026
          </p>
        </div>
      </div>
    </div>
  );
};
