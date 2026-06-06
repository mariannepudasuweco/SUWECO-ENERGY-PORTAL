import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';


type LoginPageProps = {
  onLogin: () => void;
  onSignup: () => void;
};

export default function LoginPage({ onLogin, onSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (loginError) {
      setError(loginError.message || 'Invalid email or password.');
      return;
    }

    sessionStorage.setItem('isAuthenticated', 'true');
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#1b2d48] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#136cb2]/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-[#f5a623]/5 blur-[80px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-xl mb-6 shadow-lg shadow-white/5">
            <img 
              src="https://res.cloudinary.com/dit5iwj2o/image/upload/v1779070798/suweco_logo_kdfwwq.jpg" 
              alt="Suweco Logo" 
              className="h-12 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-inter">Portal Login</h1>
          <p className="text-gray-400 text-sm text-center">Enter your Supabase login credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#f5a623] transition-colors`}
              autoFocus
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#f5a623] transition-colors`}
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#f5a623] hover:bg-[#e09510] disabled:opacity-60 text-white font-medium px-5 py-3.5 rounded-xl transition-colors font-inter"
          >
            {isLoading ? 'Signing in...' : 'Access Portal'}
          </button>

          <button
  type="button"
  onClick={onSignup}
  className="w-full mt-3 text-sm text-slate-600 hover:text-slate-900"
>
  Create an account
</button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
}
