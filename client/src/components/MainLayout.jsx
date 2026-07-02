import { useState } from 'react';
import { Outlet, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function MainLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;

    try {
      await usersAPI.delete(user.id);
      logoutUser();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const isOwnProfile = user?.username === username;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h2>
            <Link to={`/users/${username}/dashboard`} className="brand-link">
              DashBoard
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
              {user?.is_admin ? (
                <Link
                  to={`/users/${username}/admin`}
                  className="nav-btn admin-btn"
                >
                  Management
                </Link>
              ) : null}
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
                <tr><td><strong>Name</strong></td><td>{user.name}</td></tr>
                <tr><td><strong>Username</strong></td><td>{user.username}</td></tr>
                <tr><td><strong>Email</strong></td><td>{user.email}</td></tr>
                <tr><td><strong>Phone</strong></td><td>{user.phone?.split(' x')[0]}</td></tr>
              </tbody>
            </table>
            <button className="btn-primary" onClick={() => setShowInfo(false)}>
              Close
            </button>
            {!user?.is_admin && (
              <button
                className="btn-delete"
                onClick={handleDeleteAccount}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      )}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}