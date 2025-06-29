import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, LogIn, ArrowRight, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import '../styles/pages/AuthPages.css';

interface LoginForm {
  emailOrUsername: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAppContext();
  const [loginForm, setLoginForm] = useState<LoginForm>({
    emailOrUsername: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors: Partial<LoginForm> = {};
    
    if (!loginForm.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required';
    }
    
    if (!loginForm.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (loginForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiService.login(loginForm);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear server error
    if (serverError) {
      setServerError('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container login-page">
        {/* Left side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-content">
            <div className="auth-welcome">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {serverError && (
                <div className="error-banner">
                  <p>{serverError}</p>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email or Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    name="emailOrUsername"
                    value={loginForm.emailOrUsername}
                    onChange={handleInputChange}
                    className={`input-field ${errors.emailOrUsername ? 'error' : ''}`}
                    placeholder="john@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.emailOrUsername && (
                  <p className="input-error">{errors.emailOrUsername}</p>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginForm.password}
                    onChange={handleInputChange}
                    className={`input-field ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="input-error">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="auth-image-section">
          <div className="auth-image-overlay">
            <div className="auth-image-content">
              <h2 className="auth-image-title">
                Analyze Your Resume with AI
              </h2>
              <p className="auth-image-subtitle">
                Get instant feedback on your resume and improve your chances of landing your dream job
              </p>
              
              <div className="auth-features">
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>ATS-friendly analysis</span>
                </div>
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>Keyword optimization</span>
                </div>
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>Professional feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 