import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getReceptionistPatients } from '@/lib/api';
import { Patient } from '@/types/healthcare';
import { notify } from '@/lib/notify';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // This component now acts as a layout — actual modules render in nested routes via <Outlet />

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const patientData = await getReceptionistPatients();
      setPatients(patientData);
      console.log(`✓ Loaded ${patientData.length} patients`);
    } catch (error) {
      console.error('Error loading patients:', error);
      notify.error('Failed to load patients', 'Unable to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load patients on mount and whenever returning from register page
  useEffect(() => { 
    loadPatients(); 
  }, [location.pathname, loadPatients]);

  const handleViewRecords = () => navigate('/receptionist/records');
  const handleScheduleAppointment = () => navigate('/receptionist/appointments');

  return (
    <DashboardLayout
      title="Receptionist Dashboard"
      subtitle="Patient intake and registration"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showSearch={true}
    >
      {/* Action / Navigation Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => navigate('/receptionist/register')} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </Button>
        <Button type="button" onClick={loadPatients} variant="outline" className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </Button>
        <nav className="ml-2 flex items-center gap-2">
          <NavLink to="/receptionist" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}>Dashboard</NavLink>
          <span className="text-muted-foreground">|</span>
          <NavLink to="records" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}>Records</NavLink>
          <span className="text-muted-foreground">|</span>
          <NavLink to="/receptionist/appointments" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}>Appointments</NavLink>
          {/* Consultations removed for receptionist role */}
        </nav>
      </div>

      {/* Main content area: nested routes will render here */}
      <div className="mt-4">
        <Outlet context={{ patients, loadPatients, searchQuery, setSearchQuery }} />
      </div>
    </DashboardLayout>
  );
}
