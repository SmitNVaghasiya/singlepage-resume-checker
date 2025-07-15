import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Shield, ArrowRight, Rocket, Target, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import UsernameValidator from '../utils/usernameValidation';
import '../styles/pages/AuthPages.css';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  otp: string;
}

type RegisterStep = 'details' | 'verification';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAppContext();
  const [currentStep, setCurrentStep] = useState<RegisterStep>('details');
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [serverError, setServerError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [usernameValidation, setUsernameValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  // Smart username validation - only show critical format errors in real-time
  useEffect(() => {
    if (registerForm.username) {
      const username = registerForm.username;
      
      // Only show immediate format errors that user needs to know right away
      if (/\s/.test(username)) {
        setUsernameValidation({
          isValid: false,
          message: 'Username cannot contain spaces',
          type: 'error'
        });
      } else if (!/^[a-zA-Z0-9_]*$/.test(username)) {
        setUsernameValidation({
          isValid: false,
          message: 'Username can only contain letters, numbers, and underscores',
          type: 'error'
        });
      } else {
        // Clear format errors if format is now correct and no other format issues
        setUsernameValidation(prev => {
          if (prev && (prev.message.includes('spaces') || prev.message.includes('can only contain'))) {
            return null;
          }
          return prev;
        });
      }
    } else {
      // Clear validation when field is empty
      setUsernameValidation(null);
    }
  }, [registerForm.username]);

  const handleSendOtp = async () => {
    // Validate form BEFORE sending OTP
    const newErrors: Record<string, string> = {};
    
    // Enhanced username validation
    if (!registerForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else {
      const usernameValidation = UsernameValidator.validateBasic(registerForm.username.trim());
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.errors[0];
      }
    }
    
    // Email validation
    if (!registerForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    // Password validation
    if (!registerForm.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (registerForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Show errors if validation fails
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setServerError('');
    setErrors({}); // Clear any previous errors

    try {
      await apiService.sendOtp(registerForm.email);
      setIsOtpSent(true);
      setCurrentStep('verification');
      
      // Start countdown timer
      setOtpTimer(60);
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    setServerError('');
    
    try {
      await apiService.sendOtp(registerForm.email);
      
      // Restart countdown timer
      setOtpTimer(60);
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (currentStep === 'details') {
      await handleSendOtp();
      return;
    }
    
    // Only validate OTP for verification step
    if (currentStep === 'verification') {
      const newErrors: Record<string, string> = {};
      
      if (!registerForm.otp.trim()) {
        newErrors.otp = 'OTP is required';
      } else if (registerForm.otp.length !== 6) {
        newErrors.otp = 'OTP must be 6 digits';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiService.register(registerForm);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear non-format validation errors when user starts typing in username
    if (name === 'username' && usernameValidation && !usernameValidation.message.includes('spaces') && !usernameValidation.message.includes('can only contain')) {
      setUsernameValidation(null);
    }
    
    // Clear server error
    if (serverError) {
      setServerError('');
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldTouched(prev => ({ ...prev, [name]: true }));
    
    // Show validation errors only when field is blurred and has issues
    if (name === 'username' && value.trim()) {
      // Only show requirement errors if there are no format errors already showing
      if (!usernameValidation || (!usernameValidation.message.includes('spaces') && !usernameValidation.message.includes('can only contain'))) {
        const validation = UsernameValidator.validateBasic(value.trim());
        if (!validation.isValid) {
          setUsernameValidation({
            isValid: false,
            message: validation.errors[0],
            type: 'error'
          });
        }
      }
    }
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
    setRegisterForm(prev => ({ ...prev, otp: '' }));
    setErrors({});
    setServerError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-page">
        {/* Left side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-content">
            <div className="auth-welcome">
              <h1 className="auth-title">
                {currentStep === 'details' ? 'Create your account' : 'Verify your email'}
              </h1>
              <p className="auth-subtitle">
                {currentStep === 'details' 
                  ? 'Start optimizing your resume with AI-powered insights' 
                  : `We've sent a verification code to ${registerForm.email}`
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {serverError && (
                <div className="error-banner">
                  <p>{serverError}</p>
                </div>
              )}

              {currentStep === 'details' ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={18} />
                      <input
                        type="text"
                        name="username"
                        value={registerForm.username}
                        onChange={handleInputChange}
                        onBlur={handleFieldBlur}
                        className={`input-field ${
                          errors.username || usernameValidation ? 'error' : ''
                        }`}
                        placeholder="johndoe"
                        disabled={isLoading}
                      />
                    </div>
                    {/* Show validation errors only when necessary */}
                    {(errors.username || usernameValidation) && (
                      <p className="input-error">
                        {errors.username || usernameValidation?.message}
                      </p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={registerForm.email}
                        onChange={handleInputChange}
                        className={`input-field ${errors.email ? 'error' : ''}`}
                        placeholder="john@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="input-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerForm.password}
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
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label className="input-label">Verification Code</label>
                    <div className="input-wrapper otp-input-wrapper">
                      <Shield className="input-icon" size={18} />
                      <input
                        type="text"
                        name="otp"
                        value={registerForm.otp}
                        onChange={handleInputChange}
                        className={`input-field otp-input ${errors.otp ? 'error' : ''}`}
                        placeholder="000000"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.otp && (
                      <p className="input-error">{errors.otp}</p>
                    )}
                  </div>

                  <div className="otp-actions">
                    <button
                      type="button"
                      className="btn-text"
                      onClick={handleBackToDetails}
                      disabled={isLoading}
                    >
                      Change email
                    </button>
                    
                    <button
                      type="button"
                      className={`btn-text ${otpTimer > 0 ? 'disabled' : ''}`}
                      onClick={handleResendOtp}
                      disabled={isLoading || otpTimer > 0}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend code'}
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    <span>
                      {currentStep === 'details' ? 'Sending code...' : 'Creating account...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStep === 'details' ? 'Continue' : 'Create account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
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
                Start Your Career Journey
              </h2>
              <p className="auth-image-subtitle">
                Join thousands of job seekers who've improved their resumes and landed better opportunities
              </p>
              
              <div className="auth-features">
                <div className="auth-feature">
                  <Rocket className="auth-feature-icon" />
                  <span>Boost your chances</span>
                </div>
                <div className="auth-feature">
                  <Target className="auth-feature-icon" />
                  <span>Target your applications</span>
                </div>
                <div className="auth-feature">
                  <BarChart3 className="auth-feature-icon" />
                  <span>Track your progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 