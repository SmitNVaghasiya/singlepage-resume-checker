import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Shield,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { apiService } from "../services/api";
import "../styles/pages/ProfilePage.css";

interface UserProfileData {
  username: string;
  fullName?: string;
  email: string;
  location?: string;
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

type TabType = "profile" | "settings";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout, isAuthLoading } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [profileData, setProfileData] = useState<UserProfileData>({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    location: user?.location || "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      analysisNotifications: true,
      accountActivityNotifications: true,
      marketingEmails: false,
    });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Authentication guard - redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login?redirect=/profile");
    }
  }, [user, isAuthLoading, navigate]);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        username: user.username || prev.username || "",
        fullName: user.fullName || prev.fullName || "",
        email: user.email || prev.email || "",
        location: user.location || prev.location || "",
      }));
    }
  }, [user]);

  // Don't render the page if still loading auth state
  if (isAuthLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will be redirected)
  if (!user) {
    return null;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Validate form
      const newErrors: Record<string, string> = {};

      if (!profileData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (profileData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
        newErrors.username =
          "Username can only contain letters, numbers, and underscores";
      }

      if (!profileData.email.trim()) {
        newErrors.email = "Email is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
          newErrors.email = "Invalid email format";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Update profile
      const updatedUser = await apiService.updateProfile(profileData);
      setUser(updatedUser);
      setSuccessMessage("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const newErrors: Record<string, string> = {};

      if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }

      if (!passwordData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      // Check if new password is the same as current password
      if (passwordData.newPassword === passwordData.currentPassword) {
        newErrors.newPassword =
          "You cannot use your current password as the new password. Please choose a different password.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await apiService.updatePassword(passwordData);

      setSuccessMessage("Password updated successfully!");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to update password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async (
    setting: keyof NotificationSettings,
    value: boolean
  ) => {
    try {
      const updatedSettings = { ...notificationSettings, [setting]: value };
      await apiService.updateNotificationSettings(updatedSettings);
      setNotificationSettings(updatedSettings);
      setSuccessMessage("Notification settings updated!");
    } catch (error) {
      setErrors({ general: "Failed to update notification settings" });
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      await apiService.deleteAccount();
      await logout();
      navigate("/");
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to delete account",
      });
      setIsLoading(false);
    }
  };

  const handleDeleteConfirmation = async () => {
    // Accept both with and without @ symbol
    const enteredUsername = deleteUsername.replace(/^@/, ""); // Remove @ if present
    if (enteredUsername !== user?.username) {
      setErrors({
        general: "Username does not match. Please enter your exact username.",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await apiService.deleteAccount();
      await logout();
      navigate("/");
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to delete account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteButtonClick = () => {
    setShowDeleteModal(false);
    setShowDeleteConfirmation(true);
    setDeleteUsername("");
    setErrors({});
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.exportUserData();

      // Create and download file
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-analyzer-data-${user!.username}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage("Data exported successfully!");
    } catch (error) {
      setErrors({ general: "Failed to export data. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Compact Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <User className="avatar-icon" />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user.fullName || user.username}</h1>
            {user.fullName && (
              <p className="profile-username">@{user.username}</p>
            )}
            <p className="profile-email">{user.email}</p>
            {user.location && (
              <p className="profile-location">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{user.location}</span>
              </p>
            )}
            <div className="profile-joined">
              <Calendar className="w-4 h-4" />
              <span>
                Member since{" "}
                {formatDate(user.createdAt || new Date().toISOString())}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="message success">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="message-close"
            >
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
            onClick={() => setActiveTab("profile")}
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-tab-content">
          {activeTab === "profile" && (
            <>
              {/* Profile Information */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3>
                    <User className="w-4 h-4" />
                    Profile Information
                  </h3>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    {isEditingProfile ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                    {isEditingProfile ? "Cancel" : "Edit"}
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
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              username: e.target.value,
                            })
                          }
                          className={`input-field-compact ${
                            errors.username ? "error" : ""
                          }`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder={user?.username || "Enter username"}
                        />
                      </div>
                      {errors.username && (
                        <p className="input-error-compact">{errors.username}</p>
                      )}
                    </div>

                    <div className="input-group-compact">
                      <label className="input-label-compact">Full Name</label>
                      <div className="input-wrapper-compact">
                        <svg
                          className="input-icon-compact"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <input
                          type="text"
                          value={profileData.fullName || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              fullName: e.target.value,
                            })
                          }
                          className={`input-field-compact ${
                            errors.fullName ? "error" : ""
                          }`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder="Enter your full name (optional)"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="input-error-compact">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="input-group-compact">
                      <label className="input-label-compact">Email</label>
                      <div className="input-wrapper-compact">
                        <Mail className="input-icon-compact" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                          className={`input-field-compact ${
                            errors.email ? "error" : ""
                          }`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder={user?.email || "Enter email"}
                        />
                      </div>
                      {errors.email && (
                        <p className="input-error-compact">{errors.email}</p>
                      )}
                    </div>

                    <div className="input-group-compact">
                      <label className="input-label-compact">Location</label>
                      <div className="input-wrapper-compact">
                        <svg
                          className="input-icon-compact"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          value={profileData.location || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              location: e.target.value,
                            })
                          }
                          className={`input-field-compact ${
                            errors.location ? "error" : ""
                          }`}
                          disabled={!isEditingProfile || isLoading}
                          placeholder="Enter your location (optional)"
                        />
                      </div>
                      {errors.location && (
                        <p className="input-error-compact">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="form-actions-compact">
                      <button
                        type="submit"
                        className="btn-primary-small"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Security */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3>
                    <Shield className="w-4 h-4" />
                    Security
                  </h3>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>

                {!isChangingPassword && (
                  <div className="security-info">
                    <p className="security-note">
                      <Shield className="w-4 h-4" />
                      You can change your password here or use the "Forgot
                      Password" feature on the login page if you need to reset
                      it. Note: You cannot use your current password as the new
                      password for security reasons.
                    </p>
                  </div>
                )}

                {isChangingPassword && (
                  <form
                    onSubmit={handlePasswordUpdate}
                    className="compact-form"
                  >
                    <div className="input-group-compact">
                      <label className="input-label-compact">
                        Current Password
                      </label>
                      <div className="input-wrapper-compact">
                        <Lock className="input-icon-compact" />
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className={`input-field-compact ${
                            errors.currentPassword ? "error" : ""
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="password-toggle-compact"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="input-error-compact">
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="form-grid-compact">
                      <div className="input-group-compact">
                        <label className="input-label-compact">
                          New Password
                        </label>
                        <div className="input-wrapper-compact">
                          <Lock className="input-icon-compact" />
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => {
                              const newPassword = e.target.value;
                              setPasswordData({ ...passwordData, newPassword });

                              // Clear error when user starts typing
                              if (errors.newPassword) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.newPassword;
                                  return newErrors;
                                });
                              }

                              // Real-time validation to check if new password matches current password
                              if (
                                newPassword &&
                                passwordData.currentPassword &&
                                newPassword === passwordData.currentPassword
                              ) {
                                setErrors((prev) => ({
                                  ...prev,
                                  newPassword:
                                    "You cannot use your current password as the new password. Please choose a different password.",
                                }));
                              }
                            }}
                            className={`input-field-compact ${
                              errors.newPassword ? "error" : ""
                            }`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="password-toggle-compact"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                new: !showPasswords.new,
                              })
                            }
                          >
                            {showPasswords.new ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.newPassword && (
                          <p className="input-error-compact">
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div className="input-group-compact">
                        <label className="input-label-compact">
                          Confirm Password
                        </label>
                        <div className="input-wrapper-compact">
                          <Lock className="input-icon-compact" />
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className={`input-field-compact ${
                              errors.confirmPassword ? "error" : ""
                            }`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="password-toggle-compact"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                confirm: !showPasswords.confirm,
                              })
                            }
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="input-error-compact">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="form-actions-compact">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
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
                        {isLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Data Export */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3>
                    <BarChart3 className="w-4 h-4" />
                    Data Export
                  </h3>
                </div>

                <div className="export-compact">
                  <div className="export-info-compact">
                    <span className="export-title">Download Your Data</span>
                    <small>
                      Export profile and analysis data in JSON format
                    </small>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="btn-secondary-small"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Data
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              {/* Notification Settings */}
              <div className="content-section">
                <div className="section-header-compact">
                  <h3>
                    <Bell className="w-4 h-4" />
                    Notifications
                  </h3>
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
                        onChange={(e) =>
                          handleNotificationUpdate(
                            "analysisNotifications",
                            e.target.checked
                          )
                        }
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
                        checked={
                          notificationSettings.accountActivityNotifications
                        }
                        onChange={(e) =>
                          handleNotificationUpdate(
                            "accountActivityNotifications",
                            e.target.checked
                          )
                        }
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
                        onChange={(e) =>
                          handleNotificationUpdate(
                            "marketingEmails",
                            e.target.checked
                          )
                        }
                      />
                      <span className="toggle-slider-compact"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="content-section danger-zone-compact">
                <div className="section-header-compact">
                  <h3>
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h3>
                </div>

                <div className="danger-content-compact">
                  <div className="danger-info-compact">
                    <span className="danger-title">Delete Account</span>
                    <small>Permanently delete your account and all data</small>
                  </div>
                  <button
                    onClick={handleDeleteButtonClick}
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
              <h3 style={{ color: "white" }}>Delete Account</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-content">
                <AlertTriangle className="warning-icon" />
                <p>
                  Are you sure you want to delete your account? This will
                  permanently remove:
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
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Username Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h3 style={{ color: "white" }}>Confirm Account Deletion</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteUsername("");
                  setErrors({});
                }}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-content">
                <AlertTriangle className="warning-icon" />
                <p>
                  To permanently delete your account @{user?.username}, please
                  enter your username below
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <input
                    type="text"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      marginBottom: "1rem",
                    }}
                  />
                  {errors.general && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "0.875rem",
                        margin: "0",
                      }}
                    >
                      {errors.general}
                    </p>
                  )}
                </div>
                <p className="warning-text">
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteUsername("");
                  setErrors({});
                }}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmation}
                className="btn-danger"
                disabled={isLoading || !deleteUsername.trim()}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
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
