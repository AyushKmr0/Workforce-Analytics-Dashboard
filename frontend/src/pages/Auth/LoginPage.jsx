import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { forgotPassword } from '../../services/authService';

function routeForRole(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'HR') return '/hr';
  return '/employee';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const user = await login(form);
      showToast('Logged in successfully.');
      navigate(routeForRole(user.role), { replace: true });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    if (!form.email) {
      setMessage('Enter your email first.');
      showToast('Enter your email first.', 'info');
      return;
    }
    try {
      const data = await forgotPassword(form.email);
      setMessage(data.message);
      showToast(data.message, 'info');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset request failed';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-8 py-12 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Employee Analytics Platform</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950">Workforce intelligence with secure role-based access.</h1>
          <p className="mt-5 text-lg text-slate-600">Login once. The platform opens the correct Admin, HR, or Employee workspace automatically.</p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <form className="card w-full max-w-md p-8" onSubmit={submit}>
          <h2 className="text-2xl font-bold text-slate-950">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">Role is detected from your account.</p>
          <div className="mt-6 space-y-4">
            <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700">{message}</div>}
          <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          <button type="button" className="mt-4 w-full text-sm font-bold text-blue-600" onClick={requestReset}>Forgot password?</button>
        </form>
      </section>
    </main>
  );
}
