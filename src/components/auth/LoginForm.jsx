import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithProvider, authError, resetAuthError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Une erreur s\'est produite lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider) => {
    try {
      setError(null);
      await signInWithProvider(provider);
    } catch (err) {
      console.error('OAuth login error:', err);
      setError(err.message || 'Erreur lors de la connexion.');
    }
  };


  return (
    <div className="w-full max-w-md">
      <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              créez un compte
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <Button fullWidth variant="secondary" onClick={() => handleProviderSignIn('google')}>Se connecter avec Google</Button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Mot de passe oublié?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Se connecter
          </Button>
        </form>

      </div>
    </div>
  );
};

export default LoginForm;