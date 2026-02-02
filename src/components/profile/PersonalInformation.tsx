import React, { useState, useEffect } from 'react';
import { api, type ProfileUser } from '../../services/api';

type Props = {
  editing: boolean;
  onDone: () => void;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PersonalInformation: React.FC<Props> = ({ editing, onDone, notify }) => {
  const [formData, setFormData] = useState<Partial<ProfileUser>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.profile(token);
          setFormData(res.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username || formData.username.trim().length === 0) newErrors.username = 'Username is required';
    if (!formData.email || formData.email.trim().length === 0) newErrors.email = 'Email is required';
    if (formData.phone && !/^\+?[0-9]{7,15}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await api.updateProfile(token, {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        });
        setFormData(res.user);
        notify('Profile changes saved', 'success');
        onDone();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      notify(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Refetch profile to reset changes
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.profile(token);
          setFormData(res.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
    onDone();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Personal Information</h3>
      </div>
      <div className="card-body">
        <form>
          <div className="form-row">
            <input id="pi-username" type="text" name="username" value={formData.username || ''} onChange={handleChange} readOnly={!editing} placeholder="Enter username" />
            <label htmlFor="pi-username">Username</label>
            {errors.username && <small className="error-text">{errors.username}</small>}
          </div>
          <div className="form-row">
            <input id="pi-email" type="email" name="email" value={formData.email || ''} onChange={handleChange} readOnly={!editing} placeholder="Enter email" />
            <label htmlFor="pi-email">Email</label>
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>
          <div className="form-row">
            <input id="pi-phone" type="text" name="phone" value={formData.phone || ''} onChange={handleChange} readOnly={!editing} placeholder="" />
            <label htmlFor="pi-phone">Phone</label>
            {errors.phone && <small className="error-text">{errors.phone}</small>}
          </div>
          <div className="form-row">
            <input id="pi-address" type="text" name="address" value={formData.address || ''} onChange={handleChange} readOnly={!editing} placeholder="" />
            <label htmlFor="pi-address">Address</label>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving || !editing}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInformation;