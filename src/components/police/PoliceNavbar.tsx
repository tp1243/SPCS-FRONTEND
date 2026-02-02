import { useEffect, useState } from 'react';
import { FiBell, FiSearch, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import BrandIcon from '../BrandIcon';
import { policeApi } from '../../services/police';
import type { PoliceNotificationItem } from '../../types';
import { connectRealtime } from '../../services/realtime';
import NotificationToast from '../NotificationToast';

type Props = {
  token: string;
  username: string;
  onSearch: (q: string) => void;
  onLogout: () => void;
};

export default function PoliceNavbar({ token, username, onSearch, onLogout }: Props) {
  const [q, setQ] = useState('');
  const [openProfile, setOpenProfile] = useState(false);
  const [openBell, setOpenBell] = useState(false);
  const [notifications, setNotifications] = useState<PoliceNotificationItem[]>([]);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') || 'en');
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem('sound') === 'on');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let active = true;
    const lastSeenRef = { value: '' } as { value: string };
    policeApi.listNotifications(token).then((res) => {
      if (!active) return;
      setNotifications(res.notifications);
      const newest = res.notifications[0]?.createdAt || '';
      lastSeenRef.value = newest;
    }).catch(() => {});
    const id = setInterval(() => {
      policeApi.listNotifications(token).then((res) => {
        setNotifications(res.notifications);
        const newest = res.notifications[0]?.createdAt || '';
        if (newest && newest !== lastSeenRef.value) {
          lastSeenRef.value = newest;
          const msg = res.notifications[0]?.message || 'New complaint raised';
          setToast({ message: msg, type: 'info' });
        }
      }).catch(() => {});
    }, 8000);
    // Real-time socket connection for police station alerts (new complaints)
    const socket = connectRealtime('police', token);
    socket.on('police:new_complaint', (payload: { message: string; complaintId?: string; createdAt?: string }) => {
      setToast({ message: payload.message, type: 'info' });
      setNotifications((prev) => [{
        _id: String(Date.now()),
        message: payload.message,
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
        complaintId: payload.complaintId || undefined,
        station: '',
      }, ...prev]);
    });
    return () => { active = false; clearInterval(id); socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="dash-navbar">
      <div className="dash-left">
        <div className="logo" aria-label="Smart Police Complaint System (SPCS)">
          <BrandIcon height={24} className="logo-icon" title="SPCS logo" />
          <span className="logo-text">CIVICSHIELD</span>
        </div>
      </div>
      <div className="dash-center">
        <div className="search">
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, ID, status" />
          <button className="btn sm" onClick={() => onSearch(q)}>Search</button>
        </div>
      </div>
      <div className="dash-right">
        <div className="welcome">Welcome, {username}!</div>
        <button className="btn toggle" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <FiMoon /> : <FiSun />}
        </button>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="btn toggle" style={{ background: 'transparent', color: 'var(--text)', borderColor: '#24324a' }}>
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="mr">MR</option>
        </select>
        <button className="btn toggle" onClick={() => { const next = !soundOn; setSoundOn(next); localStorage.setItem('sound', next ? 'on' : 'off'); window.dispatchEvent(new Event(next ? 'spcs:enable-sound' : 'spcs:disable-sound')); }} title={soundOn ? 'Disable sound' : 'Enable sound'}>
          <FiBell />
        </button>
        <div className="avatar" onClick={() => setOpenProfile(v => !v)}><FiUser /></div>
        <div className="bell" onClick={() => setOpenBell(v => !v)}>
          <FiBell />{unread > 0 && <span className="badge">{unread}</span>}
        </div>
        {openProfile && (
          <div className="dropdown">
            <button onClick={() => setOpenProfile(false)}>View Profile</button>
            <button onClick={() => setOpenProfile(false)}>Edit Profile</button>
            <button onClick={() => setOpenProfile(false)}>Settings</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        )}
        {openBell && (
          <div className="dropdown wide">
            {notifications.length === 0 ? <div className="muted">No updates</div> : notifications.map(n => (
              <div key={n._id} className={`notif ${n.read ? '' : 'unread'}`}>
                <div>{n.message}</div>
                <small>{new Date(n.createdAt || '').toLocaleString()}</small>
              </div>
            ))}
            <div className="actions"><button className="btn ghost" onClick={async () => { const r = await policeApi.markAllNotificationsRead(token); setNotifications(r.notifications); }}>Clear All</button></div>
          </div>
        )}
        {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </header>
  );
}