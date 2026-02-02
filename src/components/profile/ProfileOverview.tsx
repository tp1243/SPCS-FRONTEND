import React, { useState, useEffect } from 'react';
import { api, type ProfileUser } from '../../services/api';

type Props = {
  onEdit: () => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ProfileOverview: React.FC<Props> = ({ onEdit, notify }) => {
  const [user, setUser] = useState<ProfileUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.profile(token);
          setUser(res.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchUser();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const dataUrl = String(reader.result)
        const res = await api.updateProfile(token, { avatarUrl: dataUrl })
        setUser(res.user)
        notify('Avatar updated successfully', 'success')
      } catch (err) {
        console.error('Avatar update failed', err)
        notify('Failed to update avatar', 'error')
      }
    }
    reader.readAsDataURL(file)
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Profile Overview</h3>
      </div>
      <div className="card-body">
        <div className="avatar-upload">
          <div className="avatar-preview">
            <div id="imagePreview" style={{ backgroundImage: `url(${user.avatarUrl || 'http://i.pravatar.cc/500?img=7'})` }}></div>
          </div>
          <div className="avatar-edit">
            <input type='file' id="imageUpload" accept=".png, .jpg, .jpeg" onChange={handleAvatarChange} />
            <label htmlFor="imageUpload"></label>
          </div>
        </div>
        <div className="user-info">
          <h4>{user.username}</h4>
          <p>{user.email}</p>
          {user.phone && <p>{user.phone}</p>}
          {user.address && <p>{user.address}</p>}
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onEdit}>Edit Profile</button>
          <button className="btn ghost" onClick={() => window.scrollTo({ top: 9999, behavior: 'smooth' })}>Change Password</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;