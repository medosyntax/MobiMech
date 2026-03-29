import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-700 flex items-center justify-center px-4">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wrench className="h-8 w-8 text-brand-500" />
            <span className="text-2xl font-bold text-brand-500">ZONGEDO</span>
          </div>
          <h1 className="text-xl font-semibold text-navy-700">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your business</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading || !username || !password} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
