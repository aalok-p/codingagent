import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../api/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'buyer';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('userId', data.user_id);
      sessionStorage.setItem('role', data.role);
      navigate(data.role === 'seller' ? '/seller/products' : '/buyer/products');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const data = await googleLogin(credentialResponse.credential);
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('userId', data.user_id);
      sessionStorage.setItem('role', data.role);
      if (data.role_pending) {
        navigate('/role-picker');
      } else {
        navigate(data.role === 'seller' ? '/seller/products' : '/buyer/products');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Google login failed. Please try again.';
      setServerError(msg);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign In</h2>
        <p className="auth-role-hint">
          Logging in as <strong>{role}</strong>
        </p>

        {serverError && <div className="error-banner">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'input-error' : ''}
              placeholder="you@example.com"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'input-error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setServerError('Google login failed')}
            text="signin_with"
          />
        </div>

        <p className="auth-link">
          Don't have an account? <Link to={`/signup?role=${role}`}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
