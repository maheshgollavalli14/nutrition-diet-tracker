import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTimeInTimeZone, getErrorMessage } from '../utils/nutrition';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      showToast('Full name must be at least 2 characters.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), timezone: user?.timezone || 'UTC' });
      showToast('Profile settings saved.');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile &amp; Preferences</h1>
          <p className="page-subtitle">Manage your display name and account settings.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="prof-email">Email Address</label>
            <input id="prof-email" className="form-input" value={user?.email || ''} disabled />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prof-name">Full Name</label>
            <input
              id="prof-name"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {user?.createdAt && (
            <p className="form-hint" style={{ marginBottom: 18 }}>
              Member since {formatDateTimeInTimeZone(user.createdAt, user?.timezone || 'UTC')}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
