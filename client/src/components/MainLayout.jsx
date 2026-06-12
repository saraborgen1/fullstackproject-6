import { useState } from 'react';
import { Outlet, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isOwnProfile = user?.username === username;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h2>
            <Link to={`/users/${username}/dashboard`} className="brand-link">
              JSONPlaceholder Client
            </Link>
          </h2>
          <span className="user-greeting">
            Welcome, <strong>{user?.name || username}</strong>
          </span>
        </div>
        <nav className="header-nav">
          <Link to={`/users/${username}/todos`} className="nav-btn">Todos</Link>
          <Link to={`/users/${username}/posts`} className="nav-btn">Posts</Link>
          <Link to={`/users/${username}/albums`} className="nav-btn">Albums</Link>
          {isOwnProfile && (
            <>
              <Link to={`/users/${username}/profile`} className="nav-btn">Profile</Link>
              {user?.is_admin && (
                <Link to="/admin" className="nav-btn admin-btn">Admin</Link>
              )}
            </>
          )}
        </nav>
        <div className="header-right">
          <button
            className="btn-info"
            onClick={() => setShowInfo(true)}
            title="Show my info"
          >
            Info
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {showInfo && user && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>My Info</h2>
            <table className="info-table">
              <tbody>
                <tr><td><strong>ID</strong></td><td>{user.id}</td></tr>
                <tr><td><strong>Name</strong></td><td>{user.name}</td></tr>
                <tr><td><strong>Username</strong></td><td>{user.username}</td></tr>
                <tr><td><strong>Email</strong></td><td>{user.email}</td></tr>
                <tr><td><strong>Phone</strong></td><td>{user.phone}</td></tr>
                <tr><td><strong>Admin</strong></td><td>{user.is_admin ? 'Yes' : 'No'}</td></tr>
                <tr><td><strong>Blocked</strong></td><td>{user.blocked ? 'Yes' : 'No'}</td></tr>
              </tbody>
            </table>
            <button className="btn-primary" onClick={() => setShowInfo(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}