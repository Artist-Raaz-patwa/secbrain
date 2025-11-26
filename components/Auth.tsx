import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { NoirButton } from './ui/NoirButton';
import { NoirInput } from './ui/NoirInput';
import { useAppStore } from '../store/useAppStore';
import { Brain } from 'lucide-react';
import { LoggerService } from '../services/logger';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setLoading = useAppStore((state) => state.setLoading);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        if(cred.user) await LoggerService.info(cred.user.uid, 'AUTH', 'User Login Successful', 'Method: Email/Password');
      } else {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if(cred.user) await LoggerService.success(cred.user.uid, 'AUTH', 'New User Registration', 'Method: Email/Password');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Identity already in use. Please login.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password too weak. Security risk.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Access denied.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await auth.signInWithPopup(googleProvider);
      if(cred.user) await LoggerService.info(cred.user.uid, 'AUTH', 'User Login Successful', 'Method: Google OAuth');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dots dark:bg-black">
      <div className="max-w-md w-full">
        {/* Header Icon - Centered floating branding */}
        <div className="relative z-10 flex justify-center -mb-8 pointer-events-none">
            <div className="bg-black dark:bg-white text-white dark:text-black p-4 border-2 border-white dark:border-black shadow-hard dark:shadow-hard-white">
                <Brain size={32} />
            </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative pt-8 overflow-hidden">
          
          <div className="text-center mt-6 mb-4">
             <h2 className="text-3xl font-display font-black tracking-tighter text-black dark:text-white">SECOND BRAIN</h2>
             <p className="font-mono text-xs text-gray-500">OPERATING SYSTEM V1.2</p>
          </div>

          {/* Explicit Mode Switcher Tabs */}
          <div className="flex border-y-2 border-black dark:border-white">
            <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 font-display font-bold text-xs tracking-wider transition-colors ${isLogin ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-50 dark:bg-neutral-800 text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
                LOGIN
            </button>
            <div className="w-0.5 bg-black dark:bg-white"></div>
            <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 font-display font-bold text-xs tracking-wider transition-colors ${!isLogin ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-50 dark:bg-neutral-800 text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
                CREATE ACCOUNT
            </button>
          </div>

          <div className="p-8">
            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 font-mono text-xs font-bold">
                ERROR: {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
                <NoirInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="human@example.com"
                required
                />
                <NoirInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                />

                <div className="pt-2">
                <NoirButton fullWidth type="submit">
                    {isLogin ? 'INITIATE SESSION' : 'REGISTER NEW IDENTITY'}
                </NoirButton>
                </div>
            </form>

            <div className="my-6 flex items-center">
                <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <span className="px-3 font-mono text-xs text-gray-500">OR</span>
                <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <NoirButton variant="secondary" fullWidth onClick={handleGoogleAuth}>
                CONTINUE WITH GOOGLE
            </NoirButton>
          </div>
        </div>
      </div>
    </div>
  );
};