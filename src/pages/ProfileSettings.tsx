import { useState, useEffect } from 'react';
import ProfileOverview from '../components/profile/ProfileOverview';
import PersonalInformation from '../components/profile/PersonalInformation';
import AccountSecurity from '../components/profile/AccountSecurity';
import Preferences from '../components/profile/Preferences';
import DeleteAccount from '../components/profile/DeleteAccount';
import '../components/profile/ProfileSettings.css';

const ProfileSettings = () => {
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'success', visible: false })

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500)
  }

  useEffect(() => {
    // Ensure we exit edit mode when navigating away later if needed
    return () => setEditing(false)
  }, [])

  return (
    <div className="profile-settings">
      <h2 className="card-title">Profile Settings</h2>
      <div className="profile-grid">
        <ProfileOverview onEdit={() => setEditing(true)} notify={notify} />
        <PersonalInformation editing={editing} onDone={() => setEditing(false)} notify={notify} />
      </div>
      <AccountSecurity notify={notify} />
      <Preferences />
      <DeleteAccount notify={notify} />

      {toast.visible && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">{toast.message}</div>
      )}
    </div>
  );
};

export default ProfileSettings;