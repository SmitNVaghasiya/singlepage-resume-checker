import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Activity,
  Settings,
  LogOut,
  Search,
  Filter,
  Eye,
  MoreVertical,
  Calendar,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Moon,
  Sun,
  Briefcase,
  User,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  ChevronDown,
  ChevronRight,
  Home,
  PieChart,
  LineChart,
  BarChart,
  Download as DownloadIcon,
  RefreshCw,
  Clock,
  Database,
  Shield,
  Bell,
  Mail,
  HelpCircle,
  CreditCard,
  Receipt,
  Link,
  UserCheck,
  UserX,
  CheckSquare,
  Square,
  MessageSquare,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import {
  adminService,
  DashboardStats,
  User as AdminUser,
  Analysis,
} from "../services/AdminService";
import SimpleChart from "../components/ui/SimpleChart";
import FeedbackManagement from "../components/admin/FeedbackManagement";
import "../styles/pages/AdminDashboardPage.css";

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { admin, logout, isAuthenticated } = useAdmin();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "analyses"
    | "feedback"
    | "system"
    | "reports"
    | "settings"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Time-based filtering
  const [timeRange, setTimeRange] = useState("30d");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Export functionality
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadDashboardData();
    initializeTheme();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [activeTab, timeRange, customDateRange]);

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("admin-theme") as
      | "light"
      | "dark"
      | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const currentTheme = savedTheme || systemTheme;
    setTheme(currentTheme);
    applyTheme(currentTheme);
  };

  const applyTheme = (newTheme: "light" | "dark") => {
    const adminDashboard = document.querySelector(".admin-dashboard-page");
    if (adminDashboard) {
      if (newTheme === "dark") {
        adminDashboard.classList.add("dark-theme");
      } else {
        adminDashboard.classList.remove("dark-theme");
      }
    }
    localStorage.setItem("admin-theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading dashboard data...");

      const [statsData, usersData, analysesData] = await Promise.all([
        adminService.getDashboardStats(timeRange, customDateRange),
        adminService.getAllUsers(1, 10, searchTerm, statusFilter),
        adminService.getAnalysesStats(
          1,
          10,
          statusFilter,
          timeRange,
          customDateRange
        ),
      ]);

      console.log("Dashboard data loaded:", {
        stats: statsData,
        users: usersData,
        analyses: analysesData,
      });

      setStats(statsData);
      setUsers(usersData.data || []);
      setAnalyses(analysesData.data || []);

      console.log("State updated:", {
        usersCount: usersData.data?.length || 0,
        analysesCount: analysesData.data?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    loadDashboardData();
  };

  const handleStatusFilterChange = (newStatusFilter: string) => {
    setStatusFilter(newStatusFilter);
    loadDashboardData();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Bulk operations handlers
  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      // Implement bulk actions here
      console.log(`Performing ${bulkAction} on ${selectedUsers.length} users`);
      await loadDashboardData();
      setSelectedUsers([]);
      setBulkAction("");
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExport = async (type: "users" | "analyses" | "stats") => {
    try {
      setExportLoading(true);
      const data = await adminService.exportData(
        type,
        exportFormat,
        timeRange,
        customDateRange
      );

      // Create and download file
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_export_${
        new Date().toISOString().split("T")[0]
      }.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle size={16} className="status-icon active" />;
      case "suspended":
        return <AlertCircle size={16} className="status-icon suspended" />;
      case "deleted":
        return <XCircle size={16} className="status-icon deleted" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getAnalysisStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="status-icon active" />;
      case "processing":
        return <Loader size={16} className="status-icon processing" />;
      case "failed":
        return <XCircle size={16} className="status-icon deleted" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  // Navigation items
  const navigationItems = [
    {
      id: "overview",
      label: "Dashboard",
      icon: Home,
      active: activeTab === "overview",
    },
    { id: "users", label: "Users", icon: Users, active: activeTab === "users" },
    {
      id: "analyses",
      label: "Analyses",
      icon: FileText,
      active: activeTab === "analyses",
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      active: activeTab === "feedback",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      active: activeTab === "reports",
    },
    {
      id: "system",
      label: "System",
      icon: Activity,
      active: activeTab === "system",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      active: activeTab === "settings",
    },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <Loader className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-error">
          <AlertCircle size={48} className="error-icon" />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={24} />
            <span className="logo-text">Resume Checker</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Quick search..."
            className="search-input"
          />
          <span className="search-shortcut">/</span>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => setActiveTab(item.id as any)}
            >
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <HelpCircle size={20} />
            <span className="nav-label">Help</span>
          </button>
          <button className="nav-item">
            <Settings size={20} />
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1>Hey, {admin?.fullName}</h1>
            <p>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="header-right">
            <div className="time-filter">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-select"
              >
                <option value="1h">Last Hour</option>
                <option value="1d">Last Day</option>
                <option value="7d">Last Week</option>
                <option value="15d">Last 15 Days</option>
                <option value="30d">Last Month</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {timeRange === "custom" && (
              <div className="custom-date-range">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      startDate: e.target.value,
                    })
                  }
                  className="date-input"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      endDate: e.target.value,
                    })
                  }
                  className="date-input"
                />
              </div>
            )}

            <button onClick={toggleTheme} className="theme-btn">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {activeTab === "overview" && (
            <div className="overview-content">
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats?.users.total || 0}</h3>
                    <p>Total Users</p>
                    <span className="stat-change positive">
                      +{stats?.users.newToday || 0} today
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FileText size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats?.analyses.total || 0}</h3>
                    <p>Total Analyses</p>
                    <span className="stat-change positive">
                      +{stats?.analyses.today || 0} today
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats?.analyses.successRate?.toFixed(1) || 0}%</h3>
                    <p>Success Rate</p>
                    <span className="stat-change">Analyses completed</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Award size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats?.analyses.averageScore || 0}</h3>
                    <p>Average Score</p>
                    <span className="stat-change">Overall performance</span>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-section">
                <SimpleChart
                  data={[
                    {
                      label: "Jan",
                      value: stats?.users.newThisMonth || 0,
                      color: "#3b82f6",
                    },
                    {
                      label: "Feb",
                      value: Math.floor((stats?.users.newThisMonth || 0) * 0.8),
                      color: "#3b82f6",
                    },
                    {
                      label: "Mar",
                      value: Math.floor((stats?.users.newThisMonth || 0) * 1.2),
                      color: "#3b82f6",
                    },
                    {
                      label: "Apr",
                      value: Math.floor((stats?.users.newThisMonth || 0) * 0.9),
                      color: "#3b82f6",
                    },
                    {
                      label: "May",
                      value: Math.floor((stats?.users.newThisMonth || 0) * 1.1),
                      color: "#3b82f6",
                    },
                    {
                      label: "Jun",
                      value: stats?.users.newThisMonth || 0,
                      color: "#3b82f6",
                    },
                  ]}
                  type="bar"
                  title="User Growth Trend"
                  height={200}
                />

                <SimpleChart
                  data={[
                    {
                      label: "Completed",
                      value: stats?.analyses.completed || 0,
                      color: "#059669",
                    },
                    {
                      label: "Failed",
                      value: stats?.analyses.failed || 0,
                      color: "#dc2626",
                    },
                    {
                      label: "Processing",
                      value:
                        (stats?.analyses.total || 0) -
                        (stats?.analyses.completed || 0) -
                        (stats?.analyses.failed || 0),
                      color: "#3b82f6",
                    },
                  ]}
                  type="pie"
                  title="Analysis status Distribution"
                  height={200}
                />
              </div>

              {/* Popular Data */}
              <div className="popular-section">
                <div className="popular-card">
                  <h3>Popular Industries</h3>
                  <div className="popular-list">
                    {stats?.popularIndustries.map((industry, index) => (
                      <div key={index} className="popular-item">
                        <span className="popular-name">{industry._id}</span>
                        <span className="popular-count">{industry.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="popular-card">
                  <h3>Popular Job Titles</h3>
                  <div className="popular-list">
                    {stats?.popularJobTitles.map((job, index) => (
                      <div key={index} className="popular-item">
                        <span className="popular-name">{job._id}</span>
                        <span className="popular-count">{job.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-content">
              <div className="content-header">
                <h2>User Management</h2>
                <div className="header-actions">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="status-filter"
                  >
                    <option value="">All status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                  </select>

                  <button
                    className="export-btn"
                    onClick={() => handleExport("users")}
                    disabled={exportLoading}
                  >
                    <DownloadIcon size={16} />
                    Export
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="bulk-actions">
                  <div className="bulk-info">
                    <span>{selectedUsers.length} users selected</span>
                  </div>
                  <div className="bulk-controls">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="bulk-action-select"
                    >
                      <option value="">Select Action</option>
                      <option value="activate">Activate</option>
                      <option value="suspend">Suspend</option>
                      <option value="delete">Delete</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className="bulk-action-btn"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            selectedUsers.length === users.length &&
                            users.length > 0
                          }
                          onChange={(e) =>
                            handleSelectAllUsers(e.target.checked)
                          }
                        />
                      </th>
                      <th>User</th>
                      <th>Email</th>
                      <th>status</th>
                      <th>Analyses</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) =>
                              handleSelectUser(user.id, e.target.checked)
                            }
                          />
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{user.username}</span>
                            {user.fullName && (
                              <span className="user-fullname">
                                {user.fullName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <div className="status-cell">
                            {getStatusIcon(user.status)}
                            <span className={`status-text ${user.status}`}>
                              {user.status}
                            </span>
                          </div>
                        </td>
                        <td>{user.analysisCount || 0}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn">
                              <Eye size={16} />
                            </button>
                            <button className="action-btn">
                              <Edit size={16} />
                            </button>
                            <button className="action-btn">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analyses" && (
            <div className="analyses-content">
              <div className="content-header">
                <h2>Analysis Management</h2>
                <div className="header-actions">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search analyses..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="status-filter"
                  >
                    <option value="">All status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button
                    className="export-btn"
                    onClick={() => handleExport("analyses")}
                    disabled={exportLoading}
                  >
                    <DownloadIcon size={16} />
                    Export
                  </button>
                </div>
              </div>

              <div className="analyses-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Job Title</th>
                      <th>Industry</th>
                      <th>status</th>
                      <th>Score</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => (
                      <tr key={analysis.id}>
                        <td>{analysis.userId}</td>
                        <td>{analysis.jobTitle || "N/A"}</td>
                        <td>{analysis.industry || "N/A"}</td>
                        <td>
                          <div className="status-cell">
                            {getAnalysisStatusIcon(analysis.status)}
                            <span className={`status-text ${analysis.status}`}>
                              {analysis.status}
                            </span>
                          </div>
                        </td>
                        <td>{analysis.overallScore || "N/A"}</td>
                        <td>
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn">
                              <Eye size={16} />
                            </button>
                            <button className="action-btn">
                              <Download size={16} />
                            </button>
                            <button className="action-btn">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="reports-content">
              <div className="content-header">
                <h2>Reports & Analytics</h2>
                <div className="header-actions">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <button
                    className="export-btn"
                    onClick={() => handleExport("stats")}
                    disabled={exportLoading}
                  >
                    <DownloadIcon size={16} />
                    Export Report
                  </button>
                </div>
              </div>

              <div className="reports-grid">
                <SimpleChart
                  data={[
                    {
                      label: "Active",
                      value: stats?.users.active || 0,
                      color: "#059669",
                    },
                    {
                      label: "Suspended",
                      value: Math.floor((stats?.users.total || 0) * 0.1),
                      color: "#d97706",
                    },
                    {
                      label: "Deleted",
                      value: Math.floor((stats?.users.total || 0) * 0.05),
                      color: "#dc2626",
                    },
                  ]}
                  type="pie"
                  title="User status Distribution"
                  height={180}
                />

                <SimpleChart
                  data={[
                    {
                      label: "Week 1",
                      value: stats?.analyses.thisWeek || 0,
                      color: "#3b82f6",
                    },
                    {
                      label: "Week 2",
                      value: Math.floor((stats?.analyses.thisWeek || 0) * 0.8),
                      color: "#3b82f6",
                    },
                    {
                      label: "Week 3",
                      value: Math.floor((stats?.analyses.thisWeek || 0) * 1.2),
                      color: "#3b82f6",
                    },
                    {
                      label: "Week 4",
                      value: Math.floor((stats?.analyses.thisWeek || 0) * 0.9),
                      color: "#3b82f6",
                    },
                  ]}
                  type="line"
                  title="Analysis Trends"
                  height={180}
                />

                <SimpleChart
                  data={[
                    {
                      label: "Success Rate",
                      value: stats?.analyses.successRate || 0,
                      color: "#059669",
                    },
                    {
                      label: "Avg Score",
                      value: stats?.analyses.averageScore || 0,
                      color: "#3b82f6",
                    },
                    {
                      label: "Total",
                      value: stats?.analyses.total || 0,
                      color: "#8b5cf6",
                    },
                  ]}
                  type="bar"
                  title="Performance Metrics"
                  height={180}
                />

                <SimpleChart
                  data={[
                    { label: "CPU", value: 75, color: "#3b82f6" },
                    { label: "Memory", value: 60, color: "#059669" },
                    { label: "Disk", value: 45, color: "#d97706" },
                    { label: "Network", value: 85, color: "#8b5cf6" },
                  ]}
                  type="bar"
                  title="System Health"
                  height={180}
                />
              </div>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="feedback-content">
              <FeedbackManagement />
            </div>
          )}

          {activeTab === "system" && (
            <div className="system-content">
              <h2>System Health</h2>
              <div className="system-status">
                <div className="status-indicator">
                  <div className="status-dot active"></div>
                  <span>System Online</span>
                </div>
              </div>
              <p>
                System monitoring and health checks will be implemented here.
              </p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-content">
              <h2>Admin Settings</h2>
              <p>
                System configuration and admin settings will be implemented
                here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
