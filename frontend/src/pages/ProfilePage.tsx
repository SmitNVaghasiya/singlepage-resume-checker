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
  Download, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Bell,
  Settings,
  Calendar,
  BarChart3,
  Loader,
  Shield
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import '../styles/pages/ProfilePage.css';

interface UserProfileData {
  username: string;
  email: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  analysisNotifications: boolean;
  accountActivityNotifications: boolean;
  marketingEmails: boolean;
}

type TabType = 'profile' | 'settings';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState<UserProfileData>({
    username: user?.username || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    analysisNotifications: true,
    accountActivityNotifications: true,
    marketingEmails: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        username: user.username || prev.username || '',
        email: user.email || prev.email || ''
      }));
    }
  }, [user]);

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
      } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
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

      // Update profile
      const updatedUser = await apiService.updateProfile(profileData);
      setUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update profile' });
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

      await apiService.updatePassword(passwordData);
      
      setSuccessMessage('Password updated successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async (setting: keyof NotificationSettings, value: boolean) => {
    try {
      const updatedSettings = { ...notificationSettings, [setting]: value };
      await apiService.updateNotificationSettings(updatedSettings);
      setNotificationSettings(updatedSettings);
      setSuccessMessage('Notification settings updated!');
    } catch (error) {
      setErrors({ general: 'Failed to update notification settings' });
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    
    try {
      await apiService.deleteAccount();
      await logout();
      navigate('/');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to delete account' });
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.exportUserData();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-analyzer-data-${user!.username}-${new Date().toISOString().split('T')[0]}.json`;
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Compact Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <User className="avatar-icon" />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user.username}</h1>
            <p className="profile-email">{user.email}</p>
            <div className="profile-joined">
              <Calendar className="w-4 h-4" />
              <span>Member since {formatDate(user.createdAt || new Date().toISOString())}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="message success">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="message-close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {errors.general && (
          <div className="message error">
            <AlertTriangle className="w-5 h-5" />
            <span>{errors.general}</span>
            <button onClick={() => setErrors({})} className="message-close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <>
              {/* Profile Information */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3><User className="w-4 h-4" />Profile Information</h3>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate} className="compact-form">
                  <div className="form-grid-compact">
                    <div className="input-group-compact">
                      <label className="input-label-compact">Username</label>
                      <div className="input-wrapper-compact">
                        <User className="input-icon-compact" />
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          className={`input-field-compact ${errors.username ? 'error' : ''}`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder={user?.username || 'Enter username'}
                        />
                      </div>
                      {errors.username && <p className="input-error-compact">{errors.username}</p>}
                    </div>

                    <div className="input-group-compact">
                      <label className="input-label-compact">Email</label>
                      <div className="input-wrapper-compact">
                        <Mail className="input-icon-compact" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className={`input-field-compact ${errors.email ? 'error' : ''}`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder={user?.email || 'Enter email'}
                        />
                      </div>
                      {errors.email && <p className="input-error-compact">{errors.email}</p>}
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="form-actions-compact">
                      <button
                        type="submit"
                        className="btn-primary-small"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Security */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3><Shield className="w-4 h-4" />Security</h3>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>

                {isChangingPassword && (
                  <form onSubmit={handlePasswordUpdate} className="compact-form">
                    <div className="input-group-compact">
                      <label className="input-label-compact">Current Password</label>
                      <div className="input-wrapper-compact">
                        <Lock className="input-icon-compact" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className={`input-field-compact ${errors.currentPassword ? 'error' : ''}`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="password-toggle-compact"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && <p className="input-error-compact">{errors.currentPassword}</p>}
                    </div>

                    <div className="form-grid-compact">
                      <div className="input-group-compact">
                        <label className="input-label-compact">New Password</label>
                        <div className="input-wrapper-compact">
                          <Lock className="input-icon-compact" />
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className={`input-field-compact ${errors.newPassword ? 'error' : ''}`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="password-toggle-compact"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.newPassword && <p className="input-error-compact">{errors.newPassword}</p>}
                      </div>

                      <div className="input-group-compact">
                        <label className="input-label-compact">Confirm Password</label>
                        <div className="input-wrapper-compact">
                          <Lock className="input-icon-compact" />
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className={`input-field-compact ${errors.confirmPassword ? 'error' : ''}`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="password-toggle-compact"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="input-error-compact">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <div className="form-actions-compact">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setErrors({});
                        }}
                        className="btn-secondary-small"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-small"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Data Export */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3><BarChart3 className="w-4 h-4" />Data Export</h3>
                </div>

                <div className="export-compact">
                  <div className="export-info-compact">
                    <span className="export-title">Download Your Data</span>
                    <small>Export profile and analysis data in JSON format</small>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Data
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              {/* Notification Settings */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3><Bell className="w-4 h-4" />Notifications</h3>
                </div>

                <div className="settings-grid">
                  <div className="setting-item-compact">
                    <div className="setting-info-compact">
                      <span className="setting-title">Email Notifications</span>
                      <small>Analysis updates and account activity</small>
                    </div>
                    <label className="toggle-switch-compact">
                      <input
                        type="checkbox"
                        checked={notificationSettings.analysisNotifications}
                        onChange={(e) => handleNotificationUpdate('analysisNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider-compact"></span>
                    </label>
                  </div>

                  <div className="setting-item-compact">
                    <div className="setting-info-compact">
                      <span className="setting-title">Security Alerts</span>
                      <small>Login attempts and security updates</small>
                    </div>
                    <label className="toggle-switch-compact">
                      <input
                        type="checkbox"
                        checked={notificationSettings.accountActivityNotifications}
                        onChange={(e) => handleNotificationUpdate('accountActivityNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider-compact"></span>
                    </label>
                  </div>

                  <div className="setting-item-compact">
                    <div className="setting-info-compact">
                      <span className="setting-title">Marketing Emails</span>
                      <small>Tips and resume optimization updates</small>
                    </div>
                    <label className="toggle-switch-compact">
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={(e) => handleNotificationUpdate('marketingEmails', e.target.checked)}
                      />
                      <span className="toggle-slider-compact"></span>
                    </label>
                  </div>
                </div>
              </div>



              {/* Danger Zone */}
              <div className="content-section danger-zone-compact">
                <div className="section-header-compact">
                  <h3><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
                </div>

                <div className="danger-content-compact">
                  <div className="danger-info-compact">
                    <span className="danger-title">Delete Account</span>
                    <small>Permanently delete your account and all data</small>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger-small"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h3>Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-content">
                <AlertTriangle className="warning-icon" />
                <p>
                  Are you sure you want to delete your account? This will permanently remove:
                </p>
                <ul>
                  <li>Your profile information</li>
                  <li>All your resume analyses</li>
                  <li>Analysis history and results</li>
                  <li>All associated data</li>
                </ul>
                <p className="warning-text">
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </div>
            <div className="modal-footer">
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
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 