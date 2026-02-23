import { useEffect, useState } from 'react';
import { getDoctorPatients, getClinicalNotes, submitDoctorNotes } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [testsRequired, setTestsRequired] = useState(false);
  const [testsOrdered, setTestsOrdered] = useState('');
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionReason, setAdmissionReason] = useState('');

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await getDoctorPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
      toast.error('Failed to load patients');
    } finally { setLoading(false); }
  };

  const openPatient = async (p: any) => {
    setSelectedPatient(p);
    // load existing clinical notes if any
    try {
      const cn = await getClinicalNotes(p.id, 'doctor');
      setDiagnosis(cn.clinical_notes || '');
      
      // Handle prescription_json which may be an object {name: dosage} or array [{name, dosage, days}]
      const rxJson = cn.prescription_json;
      if (Array.isArray(rxJson)) {
        setPrescriptions(rxJson);
      } else if (rxJson && typeof rxJson === 'object') {
        // Convert object format to array format
        setPrescriptions(Object.entries(rxJson).map(([name, dosage]) => ({ name, dosage: String(dosage), days: 1 })));
      } else {
        setPrescriptions([]);
      }
      
      setTestsRequired(Boolean(cn.tests_required));
      // tests_ordered is an array of strings (not objects with test_name)
      const testsArr = cn.tests_ordered || cn.test_recommendations || [];
      setTestsOrdered(testsArr.map((t: any) => (typeof t === 'string' ? t : t?.test_name || '')).filter(Boolean).join(', '));
      setAdmissionRecommended(Boolean(cn.admission_recommended));
      setAdmissionReason(cn.admission_reason || '');
    } catch (err) {
      // ignore missing notes
      setDiagnosis('');
      setPrescriptions([]);
      setTestsRequired(false);
      setTestsOrdered('');
      setAdmissionRecommended(false);
      setAdmissionReason('');
    }
  };

  const closeDialog = () => {
    setSelectedPatient(null);
  };

  const addPrescriptionItem = () => {
    setPrescriptions([...prescriptions, { name: '', dosage: '', days: 1 }]);
  };

  const updatePrescription = (idx: number, field: string, value: any) => {
    const clone = [...prescriptions];
    clone[idx][field] = value;
    setPrescriptions(clone);
  };

  const removePrescription = (idx: number) => {
    const clone = [...prescriptions];
    clone.splice(idx, 1);
    setPrescriptions(clone);
  };

  const handleSendToNurse = async () => {
    if (!selectedPatient) return;
    try {
      await submitDoctorNotes({
        patient_id: selectedPatient.id,
        diagnosis,
        treatment: diagnosis,
        prescription: prescriptions,
        tests_required: testsRequired,
        tests_ordered: testsOrdered ? testsOrdered.split(',').map(s=>s.trim()) : undefined,
        admission_recommended: admissionRecommended,
        admission_reason: admissionReason,
      }, 'doctor');
      toast.success('Clinical notes sent to nurse');
      closeDialog();
      loadPatients();
    } catch (err: any) {
      console.error('Failed to submit notes', err);
      toast.error(err?.message || 'Failed to send notes');
    }
  };

  return (
    <div className="healthcare-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">All Patients</h3>
        <Button variant="ghost" size="icon" onClick={loadPatients} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
        </Button>
      </div>
      <div className="flex">
        <div className="flex-1 divide-y divide-border max-h-[600px] overflow-y-auto">
          {patients.map(p => (
            <div key={p.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openPatient(p)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{p.name.split(' ').map((n:string)=>n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">ID: {p.id} • {p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.age} yrs • {p.gender}</p>
                    <p className="text-sm text-muted-foreground">Visit Status: {!p.patient_registered ? 'Registered' : p.doctor_notes_completed ? 'Completed' : 'In Progress'}</p>
                    <p className="text-sm text-muted-foreground">Tests Ordered: {p.tests_required ? 'Yes' : 'No'} • Admission Recommended: {p.admission_required ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedPatient && (
          <aside className="w-96 border-l p-4 bg-background">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{selectedPatient.name}</h4>
                <div className="text-sm text-muted-foreground">ID: {selectedPatient.id}</div>
              </div>
              <div>
                <Button variant="ghost" onClick={closeDialog}>Close</Button>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <Label>Clinical Notes / Diagnosis</Label>
                <div className="mt-2 p-2 bg-muted/20 rounded">{diagnosis || '—'}</div>
              </div>

              <div>
                <Label className="mb-2">Prescriptions / Medicines</Label>
                <div className="mt-2">
                  {prescriptions.length === 0 && <div className="text-muted-foreground">No prescriptions</div>}
                  {prescriptions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <div>
                        <div className="font-medium">{item.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{item.dosage || ''} • {item.days ? `${item.days} days` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tests Required</Label>
                  <div className="mt-2">{testsRequired ? 'Yes' : 'No'}</div>
                  {testsOrdered && <div className="text-xs text-muted-foreground mt-1">{testsOrdered}</div>}
                </div>
                <div>
                  <Label>Bed Allotment</Label>
                  <div className="mt-2">{admissionRecommended ? `Yes — ${admissionReason || 'Reason not provided'}` : 'No'}</div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={closeDialog}>Close</Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
