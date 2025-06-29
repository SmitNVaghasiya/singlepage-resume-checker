import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Upload, 
  Download, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings, 
  Bell, 
  Shield, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Camera,
  Loader
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import '../styles/pages/ProfilePage.css';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalysisHistory {
  id: string;
  fileName: string;
  analysisType: string;
  score: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  jobDescription?: string;
  suggestions?: string[];
}

interface ProfileFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'history' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    firstName: '',
    lastName: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load user profile data from database
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      try {
        // API call to get user profile data
        // const profile = await apiService.getUserProfile(user.id);
        // setProfileData({
        //   username: profile.username,
        //   email: profile.email,
        //   firstName: profile.firstName || '',
        //   lastName: profile.lastName || '',
        //   bio: profile.bio || ''
        // });
        
        // For now, initialize with user data
        setProfileData({
          username: user.username,
          email: user.email,
          firstName: '',
          lastName: '',
          bio: ''
        });
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadProfileData();
  }, [user]);

  // Load analysis history from database
  useEffect(() => {
    const loadAnalysisHistory = async () => {
      if (!user?.id) return;
      
      setIsLoadingHistory(true);
      try {
        // API call to get user's analysis history
        // const history = await apiService.getUserAnalysisHistory(user.id);
        // setAnalysisHistory(history);
        
        // For now, show empty state - will be populated from database
        setAnalysisHistory([]);
      } catch (error) {
        console.error('Failed to load analysis history:', error);
        setAnalysisHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (activeTab === 'history') {
      loadAnalysisHistory();
    }
  }, [user, activeTab]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Validate form
      const newErrors: Record<string, string> = {};
      
      if (!profileData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (profileData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      
      if (!profileData.email.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
          newErrors.email = 'Invalid email format';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // API call to update profile in database
      const updatedUser = await apiService.updateProfile({
        userId: user!.id,
        ...profileData
      });
      
      setUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const newErrors: Record<string, string> = {};
      
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // API call to update password
      await apiService.updatePassword({
        userId: user!.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccessMessage('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    
    try {
      // API call to delete account
      await apiService.deleteAccount(user!.id);
      
      await logout();
      navigate('/');
      
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to delete account. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      // API call to export user data
      const userData = await apiService.exportUserData(user!.id);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-analyzer-data-${user!.username}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage('Data exported successfully!');
    } catch (error) {
      setErrors({ general: 'Failed to export data. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDisplayName = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return user?.username || 'User';
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Modern Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                <User className="avatar-icon" />
              </div>
              <button className="avatar-upload-btn">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{getDisplayName()}</h1>
            <p className="profile-username">@{user.username}</p>
            <p className="profile-email">{user.email}</p>
            <p className="profile-joined">
              Member since {formatDate(user.createdAt || new Date().toISOString())}
            </p>
            {profileData.bio && (
              <div className="profile-bio">{profileData.bio}</div>
            )}
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <FileText className="stat-icon" />
              <span className="stat-number">{analysisHistory.length}</span>
              <span className="stat-label">Analyses</span>
            </div>
            <div className="stat-item">
              <Star className="stat-icon" />
              <span className="stat-number">
                {analysisHistory.length > 0 
                  ? Math.round(analysisHistory.reduce((sum, item) => sum + item.score, 0) / analysisHistory.length)
                  : 0
                }
              </span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`tab-button ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="tab-icon" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="message success">
              <CheckCircle className="message-icon" />
              <span>{successMessage}</span>
              <button 
                onClick={() => setSuccessMessage('')}
                className="message-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {errors.general && (
            <div className="message error">
              <AlertTriangle className="message-icon" />
              <span>{errors.general}</span>
              <button 
                onClick={() => setErrors({})}
                className="message-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <div className="input-wrapper">
                      <User className="input-icon" />
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className={`input-field ${errors.username ? 'error' : ''}`}
                        disabled={!isEditing || isLoading}
                        placeholder="Enter username"
                      />
                    </div>
                    {errors.username && <p className="input-error">{errors.username}</p>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className={`input-field ${errors.email ? 'error' : ''}`}
                        disabled={!isEditing || isLoading}
                        placeholder="Enter email"
                      />
                    </div>
                    {errors.email && <p className="input-error">{errors.email}</p>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input-field"
                      disabled={!isEditing || isLoading}
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input-field"
                      disabled={!isEditing || isLoading}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="input-field textarea"
                    disabled={!isEditing || isLoading}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <div className="character-count">
                    {profileData.bio.length}/500 characters
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="loading-spinner" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab - Same as before */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Security Settings</h2>
              </div>

              <div className="security-section">
                <div className="security-item">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Update your password to keep your account secure</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn-secondary"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordUpdate} className="password-form">
                    <div className="input-group">
                      <label className="input-label">Current Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className={`input-field ${errors.currentPassword ? 'error' : ''}`}
                          disabled={isLoading}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && <p className="input-error">{errors.currentPassword}</p>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">New Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className={`input-field ${errors.newPassword ? 'error' : ''}`}
                          disabled={isLoading}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.newPassword && <p className="input-error">{errors.newPassword}</p>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">Confirm New Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                          disabled={isLoading}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="input-error">{errors.confirmPassword}</p>}
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="btn-text"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="loading-spinner" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="security-item danger-zone">
                  <div className="security-info">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Analysis History</h2>
                <div className="section-actions">
                  <button 
                    className="btn-secondary"
                    onClick={handleExportData}
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="loading-state">
                  <Loader className="loading-icon" />
                  <h3>Loading your analysis history...</h3>
                  <p>Please wait while we fetch your data</p>
                </div>
              ) : analysisHistory.length === 0 ? (
                <div className="empty-state">
                  <FileText className="empty-icon" />
                  <h3>No analyses yet</h3>
                  <p>Start by uploading your first resume for analysis</p>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Resume
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {analysisHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-info">
                        <div className="history-header">
                          <h3 className="history-title">{item.fileName}</h3>
                          <span className={`history-score ${getScoreBadgeColor(item.score)}`}>
                            {item.score}/100
                          </span>
                        </div>
                        <div className="history-meta">
                          <div className="history-date">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.createdAt)}
                          </div>
                          <div className={`history-status status-${item.status}`}>
                            {item.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                            {item.status === 'pending' && <Clock className="w-4 h-4" />}
                            {item.status === 'failed' && <AlertTriangle className="w-4 h-4" />}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="history-actions">
                        <button className="btn-icon" title="View Analysis">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="btn-icon" title="Download Report">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Preferences</h2>
              </div>

              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Email Notifications</h3>
                    <p>Receive updates about your analyses and account activity</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Marketing Emails</h3>
                    <p>Receive tips and updates about resume optimization</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Data Export</h3>
                    <p>Download all your data including analyses and profile information</p>
                  </div>
                  <button 
                    className="btn-secondary"
                    onClick={handleExportData}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Account</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-content">
              <div className="warning-icon">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <p>
                Are you sure you want to delete your account? This action cannot be undone.
                All your data, including analysis history, will be permanently removed.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="btn-danger"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 