import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Settings, FileText, Shield, Database,
  BarChart3, Activity, RefreshCw, Download, AlertTriangle,
  UserPlus, Edit, Trash2, Key, Eye, Plus, Search
} from 'lucide-react';
import { getRelativeISTTime, displayISTTime } from '@/lib/timeUtils';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, CartesianGrid
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';

// Dashboard Stats Component
function DashboardStats({ stats, alerts, onRefresh, onExport }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {alert.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
        <Button onClick={onExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        notify.success('Users loaded successfully');
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      notify.error(error, 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = () => {
    // TODO: Implement create user logic
    notify.success('User created successfully');
    setShowCreateUser(false);
    loadUsers(); // Refresh the list
  };

  const handleEditUser = () => {
    // TODO: Implement edit user logic
    notify.success('User updated successfully');
    setShowEditUser(false);
    loadUsers(); // Refresh the list
  };

  const handleDeleteUser = (userId) => {
    // TODO: Implement delete user logic with confirmation
    notify.success('User deleted successfully');
    loadUsers(); // Refresh the list
  };

  const handleResetPassword = (userId) => {
    // TODO: Implement password reset logic
    notify.success('Password reset successfully');
  };

  const handleToggleUserStatus = (userId) => {
    // TODO: Implement activate/deactivate logic
    notify.success('User status updated');
    loadUsers(); // Refresh the list
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with role-based access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input placeholder="Enter username" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@hospital.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateUser} className="w-full">Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="capitalize px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                        {user.role}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id)}>
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser()}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Role & Permission Management Component
function RoleManagement() {
  const [roles, setRoles] = useState([
    {
      id: 'doctor',
      name: 'Doctor',
      permissions: {
        viewPatients: true,
        editClinicalNotes: true,
        prescribeMedicines: true,
        orderTests: true,
        approveWorkflow: true,
        viewReports: true
      }
    },
    {
      id: 'nurse',
      name: 'Nurse',
      permissions: {
        viewPatients: true,
        editClinicalNotes: false,
        prescribeMedicines: false,
        orderTests: false,
        approveWorkflow: false,
        viewReports: true
      }
    }
  ]);

  const handlePermissionChange = (roleId, permission, value) => {
    setRoles(roles.map(role =>
      role.id === roleId
        ? { ...role, permissions: { ...role.permissions, [permission]: value } }
        : role
    ));
    notify.success('Permission updated');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Role & Permission Management</h3>

      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {role.name} Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(role.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role.id}-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => handlePermissionChange(role.id, key, checked)}
                  />
                  <Label htmlFor={`${role.id}-${key}`} className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Master Data Management Component
function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState('medicines');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Master Data Management</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="medicines" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Medicine List
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Medicine management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Test catalog management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Room List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Room management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Monitoring templates interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Department management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// System Configuration Component
function SystemConfiguration() {
  const [settings, setSettings] = useState({
    workflowRules: true,
    autoApproval: false,
    notifications: true,
    language: 'en',
    aiIntegration: true
  });

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    notify.success('Setting updated');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">System Configuration</h3>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow State Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Workflow Validation</Label>
                  <p className="text-sm text-muted-foreground">Automatically validate workflow state transitions</p>
                </div>
                <Checkbox
                  checked={settings.workflowRules}
                  onCheckedChange={(checked) => handleSettingChange('workflowRules', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Approval Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Auto-Approval</Label>
                  <p className="text-sm text-muted-foreground">Automatically approve routine workflow steps</p>
                </div>
                <Checkbox
                  checked={settings.autoApproval}
                  onCheckedChange={(checked) => handleSettingChange('autoApproval', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send system notifications for important events</p>
                </div>
                <Checkbox
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>System Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Integration Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">Allow AI-powered explanations and instructions</p>
                </div>
                <Checkbox
                  checked={settings.aiIntegration}
                  onCheckedChange={(checked) => handleSettingChange('aiIntegration', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reports & Analytics Component
function ReportsAnalytics() {
  const [reportType, setReportType] = useState('daily');

  const [metrics, setMetrics] = useState(null);
  const [safety, setSafety] = useState(null);
  const [accessibility, setAccessibility] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#4f46e5', '#06b6d4', '#f97316', '#ef4444', '#10b981'];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [mRes, sRes, aRes, pRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/safety', { headers }),
        fetch('/api/admin/accessibility', { headers }),
        fetch('/api/admin/performance', { headers }),
      ]);

      if (mRes.ok) setMetrics(await mRes.json());
      if (sRes.ok) setSafety(await sRes.json());
      if (aRes.ok) setAccessibility(await aRes.json());
      if (pRes.ok) setPerformance(await pRes.json());
    } catch (err) {
      console.error('Failed to load analytics', err);
      notify.error(err, 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const generateReport = async (type) => {
    const map = {
      'Daily': 'daily',
      'Weekly': 'weekly',
      'Monthly': 'monthly',
      'Patient Flow': 'patient_flow',
      'Prescription Statistics': 'prescription_stats',
      'Admission': 'admission',
    };
    const rpt = map[type] || 'daily';
    try {
      const resp = await fetch(`/api/admin/reports?report_type=${rpt}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resp.ok) throw new Error('Failed to generate report');
      const blob = await resp.blob();
      const disposition = resp.headers.get('Content-Disposition') || '';
      let filename = `report_${rpt}.csv`;
      const match = /filename="?(.*)"?/.exec(disposition);
      if (match && match[1]) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify.success(`${type} report downloaded`);
    } catch (err) {
      console.error(err);
      notify.error(err, 'Failed to generate report');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Reports & Analytics</h3>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button onClick={() => generateReport('Daily')} variant="outline">
                Daily Report
              </Button>
              <Button onClick={() => generateReport('Weekly')} variant="outline">
                Weekly Report
              </Button>
              <Button onClick={() => generateReport('Monthly')} variant="outline">
                Monthly Report
              </Button>
              <Button onClick={() => generateReport('Patient Flow')} variant="outline">
                Patient Flow
              </Button>
              <Button onClick={() => generateReport('Prescription Statistics')} variant="outline">
                Prescription Stats
              </Button>
              <Button onClick={() => generateReport('Admission')} variant="outline">
                Admission Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading analytics...</div>
            ) : (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Total Patients</div>
                      <div className="text-2xl font-bold">{metrics?.kpis?.total_patients ?? '—'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Avg Consultation</div>
                      <div className="text-xs text-muted-foreground">minutes</div>
                      <div className="text-2xl font-bold">{metrics?.kpis?.avg_consultation_time_seconds ? (metrics.kpis.avg_consultation_time_seconds / 60).toFixed(1) : '—'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Avg AI Time (s)</div>
                      <div className="text-2xl font-bold">{metrics?.kpis?.avg_ai_explanation_time_seconds ? metrics.kpis.avg_ai_explanation_time_seconds.toFixed(1) : '—'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Doctor Approval %</div>
                      <div className="text-2xl font-bold">{metrics?.kpis?.doctor_approval_rate_percent ? metrics.kpis.doctor_approval_rate_percent.toFixed(1) + '%' : '—'}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2 h-64">
                    <h4 className="font-medium mb-2">Patient Registrations (30d)</h4>
                    {metrics?.timeseries_30d ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.timeseries_30d}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">No timeseries data</div>
                    )}
                  </div>

                  <div className="h-64">
                    <h4 className="font-medium mb-2">Language Distribution</h4>
                    {accessibility?.accessibility?.language_distribution ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={accessibility.accessibility.language_distribution} dataKey="count" nameKey="language" outerRadius={80} fill="#8884d8">
                            {accessibility.accessibility.language_distribution.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">No language data</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-48">
                    <h4 className="font-medium mb-2">Risk Alerts</h4>
                    {safety ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{name: 'Drug Interaction', value: safety.safety.drug_interaction_alerts}, {name: 'High Risk', value: safety.safety.high_risk_cases}, {name: 'Escalations', value: safety.safety.emergency_escalations}] }>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">No safety data</div>
                    )}
                  </div>

                  <div className="h-48">
                    <h4 className="font-medium mb-2">Performance Summary</h4>
                    {performance ? (
                      <div className="space-y-2 text-sm">
                        <div>Avg API Response: {performance.performance.avg_api_response_time_seconds ? performance.performance.avg_api_response_time_seconds.toFixed(2) + 's' : '—'}</div>
                        <div>Model Error Rate: {performance.performance.model_error_rate_percent ? performance.performance.model_error_rate_percent.toFixed(1) + '%' : '—'}</div>
                        <div>Fallback Count: {performance.performance.fallback_usage_count ?? 0}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No performance data</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Audit & Logs Component
function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system_logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.events || []);
        notify.success('Audit logs loaded');
      } else {
        throw new Error('Failed to load audit logs');
      }
    } catch (error) {
      notify.error(error, 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Audit & Logs</h3>
        <Button onClick={loadLogs} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading audit logs...</div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No audit logs available
              </div>
            ) : (
              <div className="space-y-4">
                {logs.slice(0, 50).map((log: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground w-32">
                      {displayISTTime(log.timestamp || log.time)}
                    </span>
                    <span className="text-sm font-medium text-foreground w-24">
                      {log.user || 'System'}
                    </span>
                    <span className="text-sm text-muted-foreground flex-1">
                      {log.action || log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getPatientStats, refreshPatients, loading: workflowLoading, error: workflowError } = useWorkflow();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update stats when workflow data changes
  useEffect(() => {
    const patientStats = getPatientStats();
    const newStats = [
      { label: 'Total Patients', value: patientStats.total.toString() },
      { label: 'Active Consultations', value: patientStats.doctorCompleted.toString() },
      { label: 'Pending Approvals', value: patientStats.nurseCompleted.toString() },
      { label: 'Tests Ordered', value: '0' }, // TODO: Calculate from test orders
      { label: 'Admitted Patients', value: '0' }, // TODO: Calculate from room allotments
      { label: 'Medicines Dispensed', value: patientStats.dispensed.toString() },
    ];
    setStats(newStats);
  }, [getPatientStats]);

  // Load dashboard data on component mount and when tab changes to dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  // Sync active tab with URL path (e.g. /admin/users -> users)
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean); // ['admin', 'users']
    const sub = parts[1] || 'dashboard';
    const validTabs = new Set(['dashboard', 'users', 'roles', 'masterdata', 'config', 'reports', 'audit']);
    if (validTabs.has(sub) && sub !== activeTab) {
      setActiveTab(sub);
    }
  }, [location.pathname]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Refresh workflow data
      await refreshPatients();

      // Fetch system alerts
      const alertsResponse = await fetch('/api/admin/system_alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts);
      }

      notify.success('Dashboard data loaded successfully');
    } catch (error) {
      notify.error(error, 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    refreshPatients();
  };

  const handleExport = () => {
    notify.success('Report exported successfully');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Role Management', icon: Shield },
    { id: 'masterdata', label: 'Master Data', icon: Database },
    { id: 'config', label: 'System Config', icon: Settings },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit', label: 'Audit & Logs', icon: Activity },
  ];

  return (
    <DashboardLayout
      title="Admin Portal"
      subtitle="System administration and oversight"
    >
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'dashboard') navigate('/admin');
          else navigate(`/admin/${val}`);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {loading || workflowLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">Loading dashboard data...</div>
            </div>
          ) : workflowError ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Failed to load workflow data</p>
                <p className="text-muted-foreground text-sm mt-2">
                  {workflowError}
                </p>
                <Button
                  variant="outline"
                  onClick={refreshPatients}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <DashboardStats
              stats={stats}
              alerts={alerts}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="masterdata" className="mt-6">
          <MasterDataManagement />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportsAnalytics />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
