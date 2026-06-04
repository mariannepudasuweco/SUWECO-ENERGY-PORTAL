import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'STECteam2026') {
      setError(false);
      onLogin();
    } else {
      setError(true);
    }
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
          <p className="text-gray-400 text-sm text-center">Enter the password to access the monitoring dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#f5a623] transition-colors`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 ml-1">Incorrect password. Please try again.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#f5a623] hover:bg-[#e09510] text-white font-medium px-5 py-3.5 rounded-xl transition-colors font-inter"
          >
            Access Portal
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
