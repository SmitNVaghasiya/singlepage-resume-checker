import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { adminService, AdminUser } from "../services/AdminService";

interface AdminContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  setAdminData: (adminData: AdminUser, token: string) => void;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!admin;

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { token, admin: adminData } = await adminService.login(
        username,
        password
      );
      adminService.setAuthToken(token);
      setAdmin(adminData);
      return true;
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setAdminData = (adminData: AdminUser, token: string) => {
    adminService.setAuthToken(token);
    setAdmin(adminData);
  };

  const logout = () => {
    adminService.removeAuthToken();
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    try {
      if (adminService.isAuthenticated()) {
        const adminData = await adminService.getCurrentAdmin();
        setAdmin(adminData);
      }
    } catch (error) {
      console.error("Failed to refresh admin data:", error);
      logout();
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const token = adminService.getAuthToken();
        if (token) {
          adminService.setAuthToken(token);
          // Only try to refresh admin data if we don't already have it
          if (!admin) {
            await refreshAdmin();
          }
        }
      } catch (error) {
        console.error("Failed to initialize admin:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdmin();
  }, []); // Keep empty dependency array, admin state will be handled by refreshAdmin

  const value: AdminContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    setAdminData,
    logout,
    refreshAdmin,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
