import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Stethoscope, Heart, Pill, Settings, 
  Lock, User, Eye, EyeOff, Shield, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/healthcare';
import { login as apiLogin, signup, resetPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { notify } from '@/lib/notify';

const roles: { id: UserRole; label: string; icon: typeof Users; description: string; color: string }[] = [
  { 
    id: 'receptionist', 
    label: 'Receptionist', 
    icon: Users, 
    description: 'Patient intake & registration',
    color: 'bg-info/10 text-info border-info/20 hover:bg-info/20'
  },
  { 
    id: 'doctor', 
    label: 'Doctor', 
    icon: Stethoscope, 
    description: 'Diagnosis & prescriptions',
    color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
  },
  { 
    id: 'nurse', 
    label: 'Nurse', 
    icon: Heart, 
    description: 'Patient care & education',
    color: 'bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)] border-[hsl(262,83%,58%)]/20 hover:bg-[hsl(262,83%,58%)]/20'
  },
  { 
    id: 'pharmacist', 
    label: 'Pharmacist', 
    icon: Pill, 
    description: 'Medication dispensing',
    color: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    icon: Settings, 
    description: 'System management',
    color: 'bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80'
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Signup states
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    password: '',
    role: '' as UserRole | '',
    rollnumber: '',
    phone: '',
    email: ''
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotData, setForgotData] = useState({ username_or_email: '', new_password: '', confirm_password: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !username || !password) {
      setError('Please fill in all fields and select a role');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loggedUser = await login(username, password, selectedRole as UserRole);
      if (loggedUser) {
        navigate(`/${selectedRole}`);
      } else {
        setError('Invalid credentials');
      }
    } catch (error: any) {
      // Map backend / network errors to friendly messages
      const msg = (error && error.message) ? error.message : '';
      if (msg.includes('Wrong role selected') || msg.includes('not registered under selected role')) {
        setError(msg);
      } else if (msg.includes('User not found') || msg.includes('not found')) {
        setError('No such user exists. Please sign up first.');
      } else if (msg.includes('Invalid credentials') || msg.includes('check your password')) {
        setError('Wrong password. Please try again.');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        setError('Unable to reach authentication server. Please try again later.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.username || !signupData.email || !signupData.password || !signupData.role) {
      setSignupError('Please fill in all required fields and select a role');
      return;
    }

    setSignupLoading(true);
    setSignupError('');

    try {
      await signup({ 
        username: signupData.username, 
        email: signupData.email, 
        password: signupData.password,
        role: signupData.role
      });
      // After signup, perhaps auto login or show success
      notify.success('Signup successful! Please login.');
      setSignupData({ name: '', username: '', password: '', role: '', rollnumber: '', phone: '', email: '' });
    } catch (error: any) {
      notify.error(error, 'Signup failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotData.username_or_email || !forgotData.new_password || !forgotData.confirm_password) {
      setForgotError('Please fill all fields');
      return;
    }
    if (forgotData.new_password !== forgotData.confirm_password) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      await resetPassword({ username_or_email: forgotData.username_or_email, new_password: forgotData.new_password });
      notify.success('Password reset successful. Please login with your new password.');
      setForgotSuccess('Password reset successful. Please login with your new password.');
      setShowForgot(false);
      setForgotData({ username_or_email: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      notify.error(err, 'Password reset failed');
      const msg = (err && err.message) ? err.message : '';
      setForgotError(msg || 'Password reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent flex flex-col">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="healthcare-card-elevated p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Medicortex
              </h2>
              <p className="text-muted-foreground">
                Clinical Communication System
              </p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Welcome Back</h3>
                  <p className="text-muted-foreground">Select your role and sign in</p>
                </div>

                {/* Role Selection */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Select Your Role
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 text-center group",
                        "hover:scale-105 hover:shadow-lg",
                        isSelected 
                          ? cn(role.color, "border-current shadow-md")
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all",
                        isSelected ? "bg-current/20" : "bg-muted group-hover:bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6 transition-colors",
                          isSelected ? "text-current" : "text-muted-foreground group-hover:text-primary"
                        )} />
                      </div>
                      <p className="font-semibold text-sm mb-1">{role.label}</p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRole && (
              <>
                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username or Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Forgot flow moved to dedicated page */}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Secure Sign In
                      </div>
                    )}
                  </Button>
                </form>
              </>
            )}
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Create Account</h3>
                  <p className="text-muted-foreground">Fill in your details to sign up</p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSignup} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="signup-name">Full Name *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-username">Username *</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={signupData.username}
                      onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      placeholder="Choose a password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-rollnumber">Roll Number</Label>
                    <Input
                      id="signup-rollnumber"
                      type="text"
                      value={signupData.rollnumber}
                      onChange={(e) => setSignupData({...signupData, rollnumber: e.target.value})}
                      placeholder="Enter roll number (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      placeholder="Enter email"
                      required
                    />
                  </div>

                  {/* Role Selection for Signup */}
                  <div>
                    <Label className="text-base font-medium">Select Your Role *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSignupData({...signupData, role: role.id})}
                          className={cn(
                            "p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3",
                            signupData.role === role.id
                              ? role.color.replace('hover:', '').replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')
                              : "bg-card border-border hover:bg-accent/50"
                          )}
                        >
                          <role.icon className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm">{role.label}</div>
                            <div className="text-xs opacity-75">{role.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {signupError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                      {signupError}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={signupLoading}>
                    {signupLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Signing up...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Sign Up
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Privacy Badge */}
            <div className="mt-8 flex justify-center">
              <PrivacyBadge />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 Medicortex. All rights reserved. HIPAA Compliant.
        </p>
      </footer>
    </div>
  );
}
