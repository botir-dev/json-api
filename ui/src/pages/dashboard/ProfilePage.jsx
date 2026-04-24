import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { User, Lock, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/auth';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe(profile);
      await fetchMe();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Both fields are required');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm);
      toast.success('Password changed. Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Profile Settings</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Manage your personal information and security
        </p>
      </div>

      {/* Account Info */}
      <Card style={{ marginBottom: '20px' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff' }}>
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{user?.email}</p>
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                <Badge variant={user?.role === 'ADMIN' ? 'danger' : 'primary'}>{user?.role}</Badge>
                <Badge variant={user?.isActive ? 'success' : 'danger'}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="First name"
                value={profile.firstName}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              />
              <Input
                label="Last name"
                value={profile.lastName}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
            <Input
              label="Avatar URL"
              placeholder="https://example.com/avatar.png"
              value={profile.avatarUrl}
              onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" loading={saving}>Save changes</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} style={{ color: '#64748b' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Change Password</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Current password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input
              label="New password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" loading={savingPw}>Update password</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
