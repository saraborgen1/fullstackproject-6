import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setDashboardStats(null);

    window.appCache = {
      todos: {},
      posts: {},
      albums: {},
      admin: {},
    };

    localStorage.removeItem('authUser');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('authUser', JSON.stringify(updated));
  };

  const updateDashboardStats = (stats) => {
    setDashboardStats(stats);
  };

  const updateStatCount = (type, delta) => {
    setDashboardStats((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (type === 'todo') {
        updated.todoCount = Math.max(0, updated.todoCount + delta);
      } else if (type === 'todoCompleted') {
        updated.completedTodoCount = Math.max(0, updated.completedTodoCount + delta);
      } else if (type === 'post') {
        updated.postCount = Math.max(0, updated.postCount + delta);
      } else if (type === 'album') {
        updated.albumCount = Math.max(0, updated.albumCount + delta);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser, dashboardStats, updateDashboardStats, updateStatCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}