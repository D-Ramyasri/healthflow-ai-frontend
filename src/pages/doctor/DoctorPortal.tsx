import { Outlet, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DoctorPortal() {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/doctor' || path === '/doctor/') return 'Doctor Dashboard';
    if (path.startsWith('/doctor/patients')) return 'Patient List';
    if (path.startsWith('/doctor/consultations')) return 'Consultations';
    if (path.startsWith('/doctor/prescriptions')) return 'Prescriptions';
    if (path.startsWith('/doctor/approvals')) return 'Pending Approvals';
    return 'Doctor Dashboard';
  };

  const getSubtitle = () => {
    const path = location.pathname;
    if (path.startsWith('/doctor/patients')) return 'View and manage all patients';
    if (path.startsWith('/doctor/consultations')) return 'Clinical diagnosis and treatment';
    if (path.startsWith('/doctor/prescriptions')) return 'Medication management';
    if (path.startsWith('/doctor/approvals')) return 'Review and approve reports';
    return 'Overview of patient queue and workflow status';
  };

  return (
    <DashboardLayout title={getTitle()} subtitle={getSubtitle()} showSearch={true}>
      <Outlet />
    </DashboardLayout>
  );
}
