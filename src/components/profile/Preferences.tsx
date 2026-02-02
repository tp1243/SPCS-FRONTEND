import React, { useState, useEffect } from 'react';

interface PreferencesData {
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

const Preferences = () => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'Light',
    language: 'English',
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
  });

  useEffect(() => {
    // In a real app, you would fetch these preferences from your backend
    const savedPreferences = localStorage.getItem('user-preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name in preferences.notifications) {
      const isChecked = (e.target as HTMLInputElement).checked;
      const updatedNotifications = { ...preferences.notifications, [name]: isChecked };
      const updatedPreferences = { ...preferences, notifications: updatedNotifications };
      setPreferences(updatedPreferences);
      localStorage.setItem('user-preferences', JSON.stringify(updatedPreferences));
    } else {
      const updatedPreferences = { ...preferences, [name]: value };
      setPreferences(updatedPreferences);
      localStorage.setItem('user-preferences', JSON.stringify(updatedPreferences));
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Preferences</h3>
      </div>
      <div className="card-body">
        <div className="form-row">
          <label></label>
          <select name="theme" value={preferences.theme} onChange={handleChange}>
            <option>Light</option>
            <option>Dark</option>
            <option>Auto</option>
          </select>
        </div>
        <div className="form-row">
          <label></label>
          <select name="language" value={preferences.language} onChange={handleChange}>
            <option>English</option>
            <option>Hindi</option>
            <option>Marathi</option>
          </select>
        </div>
        <div className="form-row">
          <label>Notification Preferences</label>
          <div>
            <input type="checkbox" id="emailAlerts" name="email" checked={preferences.notifications.email} onChange={handleChange} />
            <label htmlFor="emailAlerts">Email Alerts</label>
          </div>
          <div>
            <input type="checkbox" id="pushNotifications" name="push" checked={preferences.notifications.push} onChange={handleChange} />
            <label htmlFor="pushNotifications">Push Notifications</label>
          </div>
          <div>
            <input type="checkbox" id="smsAlerts" name="sms" checked={preferences.notifications.sms} onChange={handleChange} />
            <label htmlFor="smsAlerts">SMS Alerts</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;