import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Stethoscope, Users, FileText, CheckCircle } from 'lucide-react';
import { getDoctorPatients } from '@/lib/api';
import { toast } from 'sonner';

export default function DoctorHome() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await getDoctorPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Active Consultations', value: patients.filter(p => p.patient_registered && !p.doctor_notes_completed).length, icon: Stethoscope },
    { label: 'Pending Approvals', value: patients.filter(p => p.doctor_notes_completed && !p.doctor_approval_completed && p.nurse_summary_completed).length, icon: CheckCircle },
    { label: 'Patients Admitted', value: patients.filter(p => p.admission_required).length, icon: Users },
    { label: 'Tests Ordered', value: patients.filter(p => p.tests_required && !p.test_completed).length, icon: FileText },
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="healthcare-card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
            </div>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="healthcare-card p-4">
        <h3 className="font-semibold mb-4">Quick Links</h3>
        <div className="grid grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => navigate('/doctor/patients')}>Patient Records</Button>
          <Button variant="outline" onClick={() => navigate('/doctor/consultations')}>Consultations</Button>
          <Button variant="outline" onClick={() => navigate('/doctor/prescriptions')}>Prescriptions</Button>
          <Button variant="outline" onClick={() => navigate('/doctor/approvals')}>Pending Approvals</Button>
        </div>
      </div>

    </div>
  );
}
