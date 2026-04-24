import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
        padding: '24px',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
            }}
          >
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            Sign in to Enterprise
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage your products, orders, and more
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            autoComplete="email"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '8px 40px 8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '14px',
                  outline: 'none',
                  color: '#1e293b',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.password ? '#ef4444' : '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.password}</span>
            )}
          </div>

          <Button type="submit" loading={loading} style={{ marginTop: '8px', width: '100%', justifyContent: 'center', padding: '10px' }}>
            Sign in
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}
          >
            Create account
          </Link>
        </p>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <strong style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Demo credentials:</strong>
          <span>admin@enterprise.com / Admin1234!</span>
        </div>
      </div>
    </div>
  );
}
