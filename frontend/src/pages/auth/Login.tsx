import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-extrabold">NaijaShield Client Portal</h1>
        <p className="mt-2 text-slate-300">Use client@example.com / client123 for demo access.</p>
        <label className="mt-6 block text-sm">Email<input name="email" defaultValue="client@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" /></label>
        <label className="mt-4 block text-sm">Password<input name="password" type="password" defaultValue="client123" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" /></label>
        {error && <p className="mt-4 text-red-300">{error}</p>}
        <button className="mt-6 w-full rounded-full bg-gradient-to-r from-shield-green to-shield-glow px-5 py-3 font-bold">Sign in</button>
      </form>
    </div>
  );
}
