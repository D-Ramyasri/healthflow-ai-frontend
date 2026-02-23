import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/api';
import { notify } from '@/lib/notify';

export default function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !newPassword || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword({ username_or_email: usernameOrEmail, new_password: newPassword });
      notify.success('Password reset successful. Please login with your new password.');
      navigate('/');
    } catch (err: any) {
      const msg = (err && err.message) ? err.message : 'Password reset failed';
      notify.error(msg, 'Password reset failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent flex flex-col">
      <header className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Medicortex</h1>
            <p className="text-sm text-muted-foreground">Clinical Communication System</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="healthcare-card-elevated p-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Reset Password</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fp-username">Username or Email</Label>
              <Input id="fp-username" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} placeholder="Enter your username or email" />
            </div>
            <div>
              <Label htmlFor="fp-new">New Password</Label>
              <Input id="fp-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            </div>
            <div>
              <Label htmlFor="fp-confirm">Confirm New Password</Label>
              <Input id="fp-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
            </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
