'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.data.accessToken, res.data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to DataGov</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your credentials to continue</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p className="font-semibold mb-2">Demo accounts:</p>
          <p>admin@datagov.io / Admin123!</p>
          <p>owner@datagov.io / Owner123!</p>
          <p>user@datagov.io / User1234!</p>
        </div>
      </div>
    </div>
  );
}
