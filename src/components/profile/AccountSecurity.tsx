import React, { useState } from 'react';
import { api } from '../../services/api';

type Props = {
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AccountSecurity: React.FC<Props> = ({ notify }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      await api.changePassword(token, currentPassword, newPassword);
      setSuccess('Password changed successfully');
      notify('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const message = err.message || 'Failed to change password';
      setError(message);
      notify(message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Account Security</h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleChangePassword}>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="form-row">
            <input id="as-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="" />
            <label htmlFor="as-current">Current Password</label>
          </div>
          <div className="form-row">
            <input id="as-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="" />
            <label htmlFor="as-new">New Password</label>
          </div>
          <div className="form-row">
            <input id="as-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="" />
            <label htmlFor="as-confirm">Confirm New Password</label>
          </div>
          <div className="actions">
            <button type="submit" className="btn primary">Change Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSecurity;