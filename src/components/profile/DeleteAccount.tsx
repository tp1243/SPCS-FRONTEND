import React, { useState } from 'react';
import { api } from '../../services/api';

type Props = {
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DeleteAccount: React.FC<Props> = ({ notify }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      await api.deleteAccount(token, password);

      // Show interactive notification and then redirect
      notify('Account deleted successfully', 'success');
      localStorage.removeItem('token');
      setTimeout(() => { window.location.href = '/'; }, 800); // Redirect to home
    } catch (err: any) {
      const message = err.message || 'Failed to delete account';
      setError(message);
      notify(message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Delete Account</h3>
      </div>
      <div className="card-body">
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-row">
          <input id="da-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" />
          <label htmlFor="da-password">Re-enter Password to Confirm</label>
        </div>
        <div className="actions">
          <button className="btn accent" onClick={handleDelete}>Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;