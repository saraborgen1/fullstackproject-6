import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TodosPage from './pages/TodosPage';
import PostsPage from './pages/PostsPage';
import AlbumsPage from './pages/AlbumsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (user) return <Navigate to={`/users/${user.username}/dashboard`} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes with MainLayout */}
      <Route
        path="/users/:username"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="todos" element={<TodosPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        /*שרה */
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* Admin route */}
      {/* <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      /> */}

      {/* Default redirect */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={`/users/${user.username}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;