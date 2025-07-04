import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  uploadedFiles?: {
    resume?: string;
    jobDescription?: string;
  };
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  uploadedFiles 
}) => {
  const { setUser } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({
    emailOrUsername: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });

  const handleSendOtp = async () => {
    if (!registerData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.sendOtp(registerData.email);
      setOtpSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login(loginData);
      setUser(response.user);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.register(registerData);
      setUser(response.user);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ emailOrUsername: '', password: '' });
    setRegisterData({ username: '', email: '', password: '', otp: '' });
    setError('');
    setOtpSent(false);
    setShowPassword(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{isLogin ? 'Sign In Required' : 'Create Account'}</h2>
          <button onClick={onClose} className="auth-modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="auth-modal-content">
          {uploadedFiles && (
            <div className="upload-info">
              <div className="upload-info-header">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Your files are ready!</span>
              </div>
              <div className="upload-info-files">
                {uploadedFiles.resume && (
                  <div className="upload-info-file">
                    📄 {uploadedFiles.resume}
                  </div>
                )}
                {uploadedFiles.jobDescription && (
                  <div className="upload-info-file">
                    📋 {uploadedFiles.jobDescription}
                  </div>
                )}
              </div>
              <p className="upload-info-text">
                Sign in or create an account to analyze your resume with AI
              </p>
            </div>
          )}

          {error && (
            <div className="auth-error">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="emailOrUsername">Email or Username</label>
                <div className="input-with-icon">
                  <User className="input-icon" />
                  <input
                    id="emailOrUsername"
                    type="text"
                    value={loginData.emailOrUsername}
                    onChange={(e) => setLoginData({ ...loginData, emailOrUsername: e.target.value })}
                    placeholder="Enter your email or username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-with-icon">
                  <User className="input-icon" />
                  <input
                    id="username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regPassword">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="form-group">
                  <label htmlFor="otp">Verification Code</label>
                  <div className="input-with-icon">
                    <CheckCircle className="input-icon" />
                    <input
                      id="otp"
                      type="text"
                      value={registerData.otp}
                      onChange={(e) => setRegisterData({ ...registerData, otp: e.target.value })}
                      placeholder="Enter the 6-digit code"
                      required
                    />
                  </div>
                  <p className="otp-info">
                    Check your email for the verification code
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? 
                  (otpSent ? 'Creating Account...' : 'Sending Code...') :
                  (otpSent ? 'Create Account' : 'Send Verification Code')
                }
              </button>
            </form>
          )}

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={switchMode} className="auth-switch-btn">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 