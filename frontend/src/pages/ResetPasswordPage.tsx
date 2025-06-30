import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import '../styles/pages/AuthPages.css';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [resetForm, setResetForm] = useState<ResetPasswordForm>({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ResetPasswordForm>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const validateForm = () => {
    const newErrors: Partial<ResetPasswordForm> = {};
    
    if (!resetForm.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (resetForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (resetForm.newPassword.length < 8) {
      // Encourage stronger passwords
      newErrors.newPassword = 'For better security, consider using at least 8 characters';
    }
    
    if (!resetForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetForm.newPassword !== resetForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    if (!token) {
      setServerError('Invalid reset token. Please request a new password reset.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiService.resetPassword(token, resetForm.newPassword, resetForm.confirmPassword);
      setSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed. Please try again.';
      
      // Provide more specific error messages
      if (errorMessage.includes('current password')) {
        setServerError('You cannot use your current password as the new password. Please choose a different password.');
      } else if (errorMessage.includes('expired')) {
        setServerError('This password reset link has expired. Please request a new password reset from the login page.');
      } else if (errorMessage.includes('invalid')) {
        setServerError('This password reset link is invalid. Please request a new password reset from the login page.');
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ResetPasswordForm]) {
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

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-container reset-password-page">
        {/* Left side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-content">
            {success ? (
              <div className="auth-success">
                <div className="success-icon">
                  <CheckCircle size={48} />
                </div>
                <h1 className="auth-title">Password Reset Successful!</h1>
                <p className="auth-subtitle">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="btn-primary auth-submit"
                >
                  <span>Continue to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="auth-welcome">
                  <h1 className="auth-title">Reset Your Password</h1>
                  <p className="auth-subtitle">
                    Choose a strong, unique password for your account. For security reasons, you cannot reuse your current password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  {serverError && (
                    <div className="error-banner">
                      <AlertTriangle className="w-5 h-5" />
                      <p>{serverError}</p>
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={resetForm.newPassword}
                        onChange={handleInputChange}
                        className={`input-field ${errors.newPassword ? 'error' : ''}`}
                        placeholder="Enter new password"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        disabled={isLoading}
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="input-error">{errors.newPassword}</p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Confirm New Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={resetForm.confirmPassword}
                        onChange={handleInputChange}
                        className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm new password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        disabled={isLoading}
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="input-error">{errors.confirmPassword}</p>
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
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    Remember your password?{' '}
                    <button 
                      type="button"
                      onClick={handleBackToLogin}
                      className="auth-link"
                      disabled={isLoading}
                    >
                      Back to Login
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="auth-image-section">
          <div className="auth-image-overlay">
            <div className="auth-image-content">
              <h2 className="auth-image-title">
                Secure Password Reset
              </h2>
              <p className="auth-image-subtitle">
                Your account security is our priority. Reset your password safely and get back to optimizing your resume.
              </p>
              
              <div className="auth-features">
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>Encrypted connection</span>
                </div>
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>Secure token validation</span>
                </div>
                <div className="auth-feature">
                  <CheckCircle className="auth-feature-icon" />
                  <span>Password strength requirements</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 