import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    try {
      await usersAPI.update(user.id, { name, email, phone });
      updateUser({ name, email, phone });
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErr('');
    setPasswordMsg('');
    if (!oldPassword || !newPassword) {
      setPasswordErr('Both old and new password are required');
      return;
    }
    try {
      await usersAPI.changePassword(user.id, oldPassword, newPassword);
      setPasswordMsg('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordErr(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="page-container">
      <h1>
        <Link to={`/users/${username}/dashboard`} className="back-link">
          ←
        </Link>{' '}
        Profile Settings
      </h1>

      <div className="profile-columns">
        <div className="profile-section">
          <h2>Update Personal Details</h2>
          {profileMsg && <div className="success-msg">{profileMsg}</div>}
          {profileErr && <div className="error-msg">{profileErr}</div>}
          <form onSubmit={handleUpdateDetails} className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Change Password</h2>
          {passwordMsg && <div className="success-msg">{passwordMsg}</div>}
          {passwordErr && <div className="error-msg">{passwordErr}</div>}
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}