import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function PayrollAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('payroll_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('payroll_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Confidential Area</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Please enter the payroll password to access this module. <br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Hint: admin123)</span>
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '100%', padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-body)', color: 'var(--text-main)', outline: 'none' }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px' }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', justifyContent: 'center' }}>
            Access Module
          </button>
        </form>
      </div>
    </div>
  );
}
