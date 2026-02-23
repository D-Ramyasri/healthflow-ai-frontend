import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// DoctorPortal provides the DashboardLayout wrapper — do not wrap again here.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, Stethoscope, FileText, AlertTriangle, CheckCircle,
  Brain, Edit, Clock, Plus, Trash2, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { WorkflowProgress } from '@/components/ui/WorkflowProgress';
import { WorkflowTracker } from '@/components/ui/WorkflowTracker';
import { AIProcessingLoader } from '@/components/ui/AIProcessingLoader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getDoctorPatients, submitDoctorNotes, generateNurseExplanation, generatePharmacyInstructions, approveNurseSummary, getClinicalNotes, getClinicalNotesHistory, updateClinicalNotes, deleteClinicalNotes, deleteAllClinicalNotes, getPatientTests, getNurseAIExplanations } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, PrescriptionItem } from '@/types/healthcare';
import { notify } from '@/lib/notify';

interface Medicine {
  name: string;
  dosage: string;
  days: number;
  total_tablets: number;
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [clinicalNotesId, setClinicalNotesId] = useState<number | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: '', dosage: '', days: 0, total_tablets: 0 }]);
  const [aiOutputs, setAiOutputs] = useState<{ nurse: string; pharmacy: string } | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'patients' | 'consultations' | 'prescriptions' | 'approvals'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRiskAlerts, setShowRiskAlerts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testsRequired, setTestsRequired] = useState(false);
  const [testsOrdered, setTestsOrdered] = useState<string[]>([]);
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionReason, setAdmissionReason] = useState('');
  // doctors should not assign rooms; nurses handle room allotment
  const [monitoringRequired, setMonitoringRequired] = useState(false);
  const [monitoringTasks, setMonitoringTasks] = useState<string[]>([]);
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [monitoringTaskInput, setMonitoringTaskInput] = useState('');
  const [showWorkflowEdit, setShowWorkflowEdit] = useState(false);
  const [isUpdatingWorkflow, setIsUpdatingWorkflow] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [selectedConsultationRecord, setSelectedConsultationRecord] = useState<number | null>(null);

  // UI: consultation panel / modal states
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [modalPatient, setModalPatient] = useState<any | null>(null);
  const [vitals, setVitals] = useState({ bp: '', temp: '', pulse: '', spo2: '' });
  const [modalClinicalNotes, setModalClinicalNotes] = useState('');
  const [modalDiagnosis, setModalDiagnosis] = useState('');
  const [prescriptionRows, setPrescriptionRows] = useState<any[]>([
    { id: 1, name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [testRecommendation, setTestRecommendation] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [uploadedReports, setUploadedReports] = useState<FileList | null>(null);

  // Local queue + in-dashboard consultation panel state
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedInPanelPatient, setSelectedInPanelPatient] = useState<any | null>(null);
  // Doctor-only metadata (e.g. allergies, blood group) are captured during consultation
  // and should not be shown by default in list/consultation preview. Keep metadata nullable
  // at source and populate only when explicitly requested.
  const [chiefComplaintPanel, setChiefComplaintPanel] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [testList, setTestList] = useState<any[]>([]);
  const [customTestName, setCustomTestName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bedRequirement, setBedRequirement] = useState('No Admission');
  const [emergencyToggle, setEmergencyToggle] = useState(false);
  const [editingLocked, setEditingLocked] = useState(false);

  // Per-patient data cache for approvals view
  const [approvalDataMap, setApprovalDataMap] = useState<Record<number, { clinicalNotes: string; nurseExplanation: string; monitoring: string }>>({});

  const sampleQueue = [
    { id: 'P-1001', name: 'Asha Rao', age: 34, gender: 'F', time: '10:30', reason: 'Fever & cough', priority: 'Normal', status: 'Waiting' },
    { id: 'P-1002', name: 'Ravi Kumar', age: 46, gender: 'M', time: '11:00', reason: 'Chest pain', priority: 'Urgent', status: 'In Consultation' },
    { id: 'P-1003', name: 'Lina Patel', age: 27, gender: 'F', time: '11:30', reason: 'Headache', priority: 'Normal', status: 'Waiting' },
    { id: 'P-1004', name: 'Mohit Singh', age: 52, gender: 'M', time: '12:00', reason: 'Dizziness', priority: 'Emergency', status: 'Waiting' },
  ];

  const addPrescriptionRow = () => setPrescriptionRows(r => [...r, { id: Date.now(), name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removePrescriptionRow = (id: number) => setPrescriptionRows(r => r.filter(x => x.id !== id));

  // Initialize local queue from patients or sampleQueue
  useEffect(() => {
    const initial = (patients && patients.length > 0) ? patients.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender || 'N',
      time: p.registered_at || 'TBD',
      reason: p.symptoms || 'N/A',
      priority: 'Normal',
      status: p.doctor_notes_completed ? 'Completed' : 'Waiting',
      // do not inject defaults here; keep metadata nullable so dashboard shows real values only
      // keep patient metadata minimal in queue objects
    })) : sampleQueue;
    setQueue(initial as any[]);
  }, [patients]);

  const updateQueuePatient = (id: any, patch: any) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));
    if (selectedInPanelPatient && selectedInPanelPatient.id === id) {
      setSelectedInPanelPatient(prev => ({ ...prev, ...patch }));
    }
  };


  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigateToView = (view: 'dashboard' | 'patients' | 'consultations' | 'prescriptions' | 'approvals') => {
    setCurrentView(view);
    if (view === 'dashboard') navigate('/doctor');
    else navigate(`/doctor/${view}`);
  };

  // Predefined test options for ordering
  const TEST_OPTIONS = ['CBC', 'Chest X-Ray', 'ECG', 'Urine R/E', 'Blood Sugar', 'Lipid Profile'];

  const stats = [
    {
      label: 'Active Consultations',
      value: patients.filter(p => p.patient_registered && !p.doctor_notes_completed).length,
      icon: Stethoscope,
      color: 'text-primary'
    },
    {
      label: 'Pending Approvals',
      value: patients.filter(p => p.doctor_notes_completed && !p.doctor_approval_completed && p.nurse_summary_completed).length,
      icon: AlertTriangle,
      color: 'text-warning'
    },
    {
      label: 'Patients Admitted',
      value: patients.filter(p => p.admission_required).length,
      icon: Users,
      color: 'text-info'
    },
    {
      label: 'Tests Ordered',
      value: patients.filter(p => p.tests_required && !p.test_completed).length,
      icon: CheckCircle,
      color: 'text-success'
    },
  ];

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientData = await getDoctorPatients();
      setPatients(patientData);
      return patientData;
    } catch (error) {
      notify.error('Failed to load patients', 'Unable to load patients. Please try again.');
      console.error('Error loading patients:', error);
      // No mock data - only use real patient data from API
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Listen for workflow updates (e.g., nurse summary completed) and refresh list
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.type === 'nurse.summary_complete' || e?.detail?.type === 'consultation' || e?.detail?.type === 'doctor.notes_complete') {
        loadPatients();
      }
    };
    window.addEventListener('workflow:update', handler as EventListener);
    // Also listen for cross-tab BroadcastChannel messages
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('healthflow-workflow');
      bc.addEventListener('message', (ev) => {
        const msg = ev.data;
        if (msg && msg.type === 'nurse.summary_complete') {
          loadPatients();
        }
      });
    } catch (e) {
      // ignore if not supported
    }
    return () => {
      window.removeEventListener('workflow:update', handler as EventListener);
      try { bc?.close(); } catch (e) { /* ignore */ }
    };
  }, []);

  // Auto-refresh patients every 15 seconds so pending approvals stay current
  useEffect(() => {
    const interval = setInterval(() => {
      loadPatients();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load per-patient clinical notes + AI explanations when approvals view is active
  useEffect(() => {
    if (currentView !== 'approvals') return;
    const pendingPatients = patients.filter(p => p.doctor_notes_completed && !p.doctor_approval_completed && p.nurse_summary_completed);
    if (pendingPatients.length === 0) return;

    const loadApprovalData = async () => {
      const newMap: Record<number, { clinicalNotes: string; nurseExplanation: string; monitoring: string }> = {};
      await Promise.all(pendingPatients.map(async (p) => {
        let clinicalNotesText = '';
        let nurseExplanation = '';
        let monitoring = '';
        try {
          const cn = await getClinicalNotes(p.id, 'doctor');
          const parts: string[] = [];
          if (cn?.clinical_notes) parts.push(cn.clinical_notes);
          if (cn?.diagnosis) parts.push(`Diagnosis: ${cn.diagnosis}`);
          if (cn?.treatment) parts.push(`Treatment: ${cn.treatment}`);
          clinicalNotesText = parts.join('\n') || '';
          if (cn?.monitoring_required) monitoring = 'Monitoring required';
          if (cn?.monitoring_tasks) {
            const tasks = Array.isArray(cn.monitoring_tasks) ? cn.monitoring_tasks : [cn.monitoring_tasks];
            monitoring = tasks.join(', ') || monitoring;
          }
        } catch (e) { /* ignore */ }
        try {
          const aiList = await getNurseAIExplanations(p.id);
          if (aiList && aiList.length > 0) {
            nurseExplanation = aiList[0].nurse_explanation || '';
          }
        } catch (e) { /* ignore */ }
        newMap[p.id] = { clinicalNotes: clinicalNotesText, nurseExplanation, monitoring: monitoring || (p.monitoring_required ? 'Monitoring required' : 'No monitoring required') };
      }));
      setApprovalDataMap(newMap);
    };
    loadApprovalData();
  }, [currentView, patients]);

  // Handle routing based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/doctor/patients') {
      setCurrentView('patients');
    } else if (path === '/doctor/consultations') {
      setCurrentView('consultations');
    } else if (path === '/doctor/prescriptions') {
      setCurrentView('prescriptions');
    } else if (path === '/doctor/approvals') {
      setCurrentView('approvals');
    } else {
      setCurrentView('dashboard');
    }
  }, [location.pathname]);

  // Load clinical notes when patient is selected
  useEffect(() => {
    const loadClinicalNotes = async () => {
      if (selectedPatient) {
        try {
          // Load consultation history
          const history = await getClinicalNotesHistory(selectedPatient.id, 'doctor');
          setConsultationHistory(history);
          setSelectedConsultationRecord(history.length > 0 ? history[0].id : null);

          // Load the latest/selected clinical notes
          if (selectedPatient.doctor_notes_completed) {
            const notes = await getClinicalNotes(selectedPatient.id, 'doctor');
            if (notes.id) {
              setClinicalNotesId(notes.id);
              // Populate structured fields if present
              setDiagnosis(notes.diagnosis || '');
              setTreatmentNotes(notes.treatment || '');
              setClinicalObservations(notes.observations || '');
              setClinicalNotes(notes.clinical_notes || '');

              // Load medicines from prescription_json
              if (notes.prescription_json && Array.isArray(notes.prescription_json)) {
                setMedicines(notes.prescription_json.map((med: any) => ({
                  name: med.name || '',
                  dosage: med.dosage || '',
                  days: med.days || 0,
                  total_tablets: med.total_tablets || 0
                })));
              }

              // Load workflow controls
              setTestsRequired(notes.tests_required || false);
              setTestsOrdered(notes.tests_ordered || []);
              setAdmissionRecommended(notes.admission_recommended || false);
              // room allotment is nurse responsibility; ignore any room field from notes
              setAdmissionReason(notes.admission_reason || '');
              setMonitoringRequired(notes.monitoring_required || false);
              setMonitoringTasks(notes.monitoring_tasks || []);
              // Load test orders for selected patient
              try {
                const tests = await getPatientTests(selectedPatient.id, 'doctor');
                setTestOrders(tests || []);
              } catch (err) {
                console.error('Error loading patient tests:', err);
                setTestOrders([]);
              }
            }
          }
        } catch (error) {
          console.error('Error loading clinical notes:', error);
        }
      } else {
        // Reset for new patient
        setClinicalNotes('');
        setClinicalNotesId(null);
        setMedicines([{ name: '', dosage: '', days: 0, total_tablets: 0 }]);
        setTestsRequired(false);
        setAdmissionRecommended(false);
        setAdmissionReason('');
        setConsultationHistory([]);
        setSelectedConsultationRecord(null);
      }
    };
    loadClinicalNotes();
  }, [selectedPatient]);

  const workflowStatus = selectedPatient ? {
    diagnosisCompleted: selectedPatient.doctor_notes_completed,
    nurseExplanationCompleted: selectedPatient.nurse_summary_completed,
    pharmacyDispensingCompleted: selectedPatient.medicine_dispensed,
    doctorApprovalCompleted: selectedPatient.doctor_approval_completed,
  } : {
    diagnosisCompleted: false,
    nurseExplanationCompleted: false,
    pharmacyDispensingCompleted: false,
    doctorApprovalCompleted: false,
  };

  const handleSubmitDoctorNotes = async () => {
    if (!selectedPatient || !clinicalNotes.trim()) {
      notify.error('Please enter clinical notes before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const prescriptionArray = medicines.filter(med => med.name.trim() && med.dosage && med.days > 0);

      if (clinicalNotesId) {
        // Update existing
        await updateClinicalNotes(clinicalNotesId, {
          clinical_notes: clinicalNotes,
          prescription_json: prescriptionArray,
          tests_required: testsRequired,
          admission_recommended: admissionRecommended,
          admission_reason: admissionReason,
          monitoring_required: monitoringRequired,
        }, 'doctor');
        notify.success('Clinical notes updated successfully');
      } else {
        // Submit new
        await submitDoctorNotes({
          patient_id: selectedPatient.id,
          diagnosis: clinicalNotes,
          treatment: '',
          prescription: prescriptionArray,
          tests_required: testsRequired,
          admission_recommended: admissionRecommended,
          admission_reason: admissionReason,
          monitoring_required: monitoringRequired,
        }, 'doctor');
        notify.success('Doctor notes submitted successfully');
      }

      const patientData = await loadPatients(); // Refresh patient list and get fresh array

      // Update selected patient using fresh data
      const updatedPatient = patientData?.find(p => p.id === selectedPatient.id);
      if (updatedPatient) setSelectedPatient(updatedPatient);
    } catch (error) {
      notify.error('Failed to save doctor notes', 'Unable to save doctor notes.');
      console.error('Error saving doctor notes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseDosageToDosesPerDay = (dosageStr: string) => {
    // Expected formats: '1-0-1', '1/0/1', '1 0 1' or simple number '2'
    if (!dosageStr) return 1;
    const parts = dosageStr.split(/[^0-9]/).filter(Boolean);
    if (parts.length > 1) {
      return parts.reduce((s, p) => s + (parseInt(p, 10) || 0), 0);
    }
    // If single number, treat as doses per day
    const single = parseInt(dosageStr, 10);
    return isNaN(single) ? 1 : single;
  };

  const handleDashboardPanelSendToNurse = async () => {
    if (!selectedInPanelPatient) {
      notify.error('No patient selected');
      return;
    }

    // Collect sections separately
    const clinicalNotesText = modalClinicalNotes.trim();
    const diagnosisText = finalDiagnosis.trim() || provisionalDiagnosis.trim();
    
    if (!clinicalNotesText && !diagnosisText) {
      notify.error('Please enter at least clinical notes or diagnosis');
      return;
    }

    // Convert prescriptionRows to expected format
    const prescriptionArray = prescriptionRows
      .filter(row => row.name && row.name.trim())
      .map(row => ({
        name: row.name,
        dosage: row.dosage || '1-0-0',
        days: 7,
        total_tablets: 0,
      }));

    setIsSubmitting(true);
    try {
      await submitDoctorNotes({
        patient_id: selectedInPanelPatient.id,
        clinical_notes: clinicalNotesText,  // Chief complaint and clinical observations
        diagnosis: diagnosisText,  // Doctor's diagnosis
        treatment: specialInstructions.trim() || '',  // Treatment plan/special instructions
        prescription: prescriptionArray,
        tests_required: testList.length > 0,
        tests_ordered: testList.map(t => t.name),
        admission_recommended: bedRequirement !== 'No Admission',
        admission_reason: bedRequirement !== 'No Admission' ? `${bedRequirement} admission requested` : '',
      }, 'doctor');
      notify.success('Sent to nurse successfully');
      setEditingLocked(true);
      updateQueuePatient(selectedInPanelPatient.id, { status: 'Sent to Nurse' });
    } catch (error) {
      notify.error('Failed to send to nurse', String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadConsultationRecord = (record: any) => {
    // Load a specific consultation record from history
    setClinicalNotesId(record.id);
    setDiagnosis(record.diagnosis || '');
    setTreatmentNotes(record.treatment || '');
    setClinicalObservations(record.observations || '');
    setClinicalNotes(record.clinical_notes || '');

    // Load medicines from prescription_json
    if (record.prescription_json && Array.isArray(record.prescription_json)) {
      setMedicines(record.prescription_json.map((med: any) => ({
        name: med.name || '',
        dosage: med.dosage || '',
        days: med.days || 0,
        total_tablets: med.total_tablets || 0
      })));
    }

    // Load workflow controls
    setTestsRequired(record.tests_required || false);
    setTestsOrdered(record.tests_ordered || []);
    setAdmissionRecommended(record.admission_recommended || false);
    // ignore admission_room from records (nurse-managed)
    setAdmissionReason(record.admission_reason || '');
    setMonitoringRequired(record.monitoring_required || false);
    setMonitoringTasks(record.monitoring_tasks || []);

    setSelectedConsultationRecord(record.id);
    notify.success(`Loaded consultation record from ${new Date(record.created_at).toLocaleString()}`);
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient) {
      notify.error('Select a patient first');
      return;
    }

    setIsSubmitting(true);
    try {
      const prescriptionArray = medicines.filter(med => med.name.trim() && med.dosage && med.days > 0).map(m => ({ ...m }));

      const composedClinicalNotes = `Diagnosis: ${diagnosis}\nTreatment: ${treatmentNotes}\nObservations: ${clinicalObservations}`;

      if (clinicalNotesId) {
        await updateClinicalNotes(clinicalNotesId, {
          clinical_notes: composedClinicalNotes,
          prescription_json: prescriptionArray,
          tests_required: testsOrdered.length > 0,
          tests_ordered: testsOrdered,
          admission_recommended: admissionRecommended,
          admission_reason: admissionReason,
          monitoring_required: monitoringRequired,
          monitoring_tasks: monitoringTasks,
        }, 'doctor');
        notify.success('Notes saved');
      } else {
        await submitDoctorNotes({
          patient_id: selectedPatient.id,
          diagnosis: diagnosis || composedClinicalNotes,
          treatment: treatmentNotes,
          prescription: prescriptionArray,
          tests_required: testsOrdered.length > 0,
          tests_ordered: testsOrdered,
          admission_recommended: admissionRecommended,
          admission_reason: admissionReason,
          monitoring_required: monitoringRequired,
          monitoring_tasks: monitoringTasks,
        }, 'doctor');
        notify.success('Notes created');
      }

      await loadPatients();
    } catch (error) {
      notify.error('Failed to save notes', 'Unable to save notes.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToPharmacy = async () => {
    if (!selectedPatient) return;
    // Ensure prescription exists
    const prescriptionArray = medicines.filter(med => med.name.trim() && med.dosage && med.days > 0);
    if (prescriptionArray.length === 0) {
      notify.error('Add at least one medicine before sending to pharmacy');
      return;
    }

    try {
      await handleGenerateAI('pharmacy');
      // Optionally save notes as well
      await handleSaveNotes();
      notify.success('Sent to pharmacy');
      await loadPatients();
    } catch (error) {
      console.error(error);
      notify.error(error, 'Failed to send to pharmacy');
    }
  };

  const handleApproveReport = async () => {
    if (!selectedPatient) return;

    setIsSubmitting(true);
    try {
      await approveNurseSummary({ patient_id: selectedPatient.id });
      notify.success('Report approved and sent to pharmacist');
      const patientData = await loadPatients();
      const updatedPatient = patientData?.find(p => p.id === selectedPatient.id);
      if (updatedPatient) setSelectedPatient(updatedPatient);
    } catch (error) {
      notify.error(error, 'Failed to approve report');
      console.error('Error approving report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReportForPatient = async (patient: Patient) => {
    setIsSubmitting(true);
    try {
      await approveNurseSummary({ patient_id: patient.id });
      notify.success('Report approved and sent to pharmacist');
      await loadPatients();
    } catch (error) {
      notify.error(error, 'Failed to approve report');
      console.error('Error approving report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizePrescription = async (patient: Patient) => {
    // Placeholder for finalizing prescription - in real implementation, call API to set medicine_dispensed
    notify.success('Prescription finalized and sent to pharmacy');
    await loadPatients();
  };

  const handleEditApprove = async (patient: Patient) => {
    // Placeholder for edit and approve - in real implementation, open edit dialog
    notify.success('Edit and approve functionality - placeholder');
  };

  const handleRejectReport = async (patient: Patient) => {
    // Placeholder for reject and send back - in real implementation, call API to reset nurse summary
    notify.success('Report rejected and sent back to nurse');
    await loadPatients();
  };

  const handleDeleteClinicalNotes = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteClinicalNotes = async () => {
    setIsSubmitting(true);
    try {
      if (clinicalNotesId && selectedPatient) {
        // Delete specific clinical notes for selected patient
        await deleteClinicalNotes(clinicalNotesId, 'doctor');
        notify.success('Clinical notes deleted successfully. Changes will be reflected in nurse and pharmacist portals.');
        await loadPatients();
        setSelectedPatient(null);
        setClinicalNotes('');
        setClinicalNotesId(null);
        setMedicines([{ name: '', dosage: '', days: 0, total_tablets: 0 }]);
        setAiOutputs(null);
      } else {
        // No specific clinical note selected: perform global delete
        await deleteAllClinicalNotes();
        notify.success('All clinical notes and related workflow data deleted successfully');
        await loadPatients();
        // Reset local UI state
        setSelectedPatient(null);
        setClinicalNotes('');
        setClinicalNotesId(null);
        setMedicines([{ name: '', dosage: '', days: 0, total_tablets: 0 }]);
        setAiOutputs(null);
        setConsultationHistory([]);
      }
    } catch (error) {
      notify.error(error, 'Failed to delete clinical notes');
      console.error('Error deleting clinical notes:', error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!clinicalNotesId || !selectedPatient) {
      notify.error('No clinical notes to update');
      return;
    }

    setIsUpdatingWorkflow(true);
    try {
      await updateClinicalNotes(clinicalNotesId, {
        clinical_notes: clinicalNotes,
        prescription_json: medicines.filter(med => med.name.trim() && med.dosage && med.days > 0),
        tests_required: testsRequired,
        admission_recommended: admissionRecommended,
        admission_reason: admissionReason,
      }, 'doctor');

      notify.success('Workflow updated successfully. Changes will be reflected in nurse portal.');
      setShowWorkflowEdit(false);
    } catch (error) {
      notify.error(error, 'Failed to update workflow');
      console.error('Error updating workflow:', error);
    } finally {
      setIsUpdatingWorkflow(false);
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', days: 0, total_tablets: 0 }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleGenerateAI = async (type?: 'nurse' | 'pharmacy') => {
    if (!selectedPatient) {
      notify.error('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    try {
      if (type === 'nurse' || !type) {
        // Get clinical notes for the patient
        const clinicalNotesData = patients.find(p => p.id === selectedPatient.id)?.clinical_notes;
        const result = await generateNurseExplanation({
          patient_id: selectedPatient.id,
          clinical_notes: clinicalNotesData || clinicalNotes,
        }, user?.role || 'doctor');

        setAiOutputs(prev => ({
          nurse: result.nurse_explanation,
          pharmacy: prev?.pharmacy || '',
        }));

        if (type === 'nurse') notify.success('Nurse explanation generated successfully');
      }

      if (type === 'pharmacy' || !type) {
        // Prepare prescription data
        const prescriptionArray = medicines.filter(med => med.name.trim());

        if (prescriptionArray.length === 0) {
          notify.error('Please add at least one medicine before generating pharmacy instructions');
          return;
        }

        const prescription: { [key: string]: string } = {};
        prescriptionArray.forEach(med => {
          const details = [med.dosage, `${med.days} days`, `${med.total_tablets} tablets`].filter(Boolean).join(', ');
          prescription[med.name] = details;
        });

        const result = await generatePharmacyInstructions({
          patient_id: selectedPatient.id,
          prescription_json: prescription,
        }, user?.role || 'doctor');

        setAiOutputs(prev => ({
          nurse: prev?.nurse || '',
          pharmacy: result.pharmacy_instructions,
        }));

        if (type === 'pharmacy') notify.success('Pharmacy instructions generated successfully');
      }

        if (!type) {
        notify.success('AI support generated successfully');
      }

      // Refresh patient data to get updated status and update selected patient
      const patientData = await loadPatients();
      const updatedPatient = patientData?.find(p => p.id === selectedPatient.id);
      if (updatedPatient) setSelectedPatient(updatedPatient);
    } catch (error) {
      notify.error(error, 'Failed to generate AI content');
      console.error('Error generating AI content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'patients': return 'Patient List';
      case 'consultations': return 'Consultations';
      case 'prescriptions': return 'Prescriptions';
      case 'approvals': return 'Pending Approvals';
      default: return 'Doctor Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (currentView) {
      case 'patients': return 'View and manage all patients';
      case 'consultations': return 'Clinical diagnosis and treatment';
      case 'prescriptions': return 'Medication management';
      case 'approvals': return 'Review and approve reports';
      default: return 'Overview of patient queue and workflow status';
    }
  };

  // The parent `DoctorPortal` renders `DashboardLayout` with a title/subtitle.
  // Here we only render the page content; the layout header is provided by the portal.
  return (
    <>
      {/* Dashboard View - Hospital Consultation Workflow */}
      {currentView === 'dashboard' && (
        <div>
          {/* 2-Column Layout: Patient Queue (Left) + Consultation Panel (Right) */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT: Patient Consultation Queue */}
            <div className="healthcare-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Patient Queue
                </h3>
                <Button variant="ghost" size="icon" onClick={loadPatients} disabled={loading}>
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
              <div className="p-4 max-h-[750px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs font-semibold text-muted-foreground border-b sticky top-0 bg-white">
                    <tr>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">ID</th>
                      <th className="text-center py-2">Age/Gen</th>
                      <th className="text-center py-2">Priority</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((patient) => {
                      const priorityClass = patient.priority === 'Emergency' ? 'bg-red-100' : patient.priority === 'Urgent' ? 'bg-orange-100' : '';
                      const priorityTextClass = patient.priority === 'Emergency' ? 'text-red-700 font-bold' : patient.priority === 'Urgent' ? 'text-orange-700 font-semibold' : 'text-gray-700';
                      const statusClass = patient.status === 'Completed' ? 'bg-green-100' : patient.status === 'Waiting' ? 'bg-yellow-50' : '';
                      
                      return (
                        <tr
                          key={patient.id}
                          className={`border-b hover:bg-gray-100 cursor-pointer transition-colors ${priorityClass}`}
                          onClick={() => {
                              // find the full patient record if available and use that for the panel
                              const full = patients.find(pp => pp.id === patient.id) || patient;
                              setSelectedInPanelPatient(full);
                              updateQueuePatient(patient.id, { status: 'In Consultation' });
                              setChiefComplaintPanel(patient.reason || '');
                              setPrescriptionRows([{ id: 1, name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
                              setTestList([]);
                              setEmergencyToggle(false);
                              setBedRequirement('No Admission');
                              setEditingLocked(false);
                                // Do not populate or display doctor-only metadata here; doctors will capture them during consultation.
                            }}
                        >
                          <td className="py-3 px-2 font-medium text-sm">{patient.name}</td>
                          <td className="py-3 px-2 text-xs">{patient.id}</td>
                          <td className="py-3 px-2 text-xs text-center">{patient.age}/{patient.gender}</td>
                          <td className={`py-3 px-2 text-xs text-center font-bold ${priorityTextClass}`}>{patient.priority}</td>
                          <td className={`py-3 px-2 text-xs text-center font-semibold ${statusClass}`}>{patient.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* RIGHT: Consultation Panel */}
            <div className={`healthcare-card max-h-[750px] overflow-y-auto ${emergencyToggle && selectedInPanelPatient ? 'border-l-4 border-red-600' : ''}`}>
              {selectedInPanelPatient ? (
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">{selectedInPanelPatient.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {selectedInPanelPatient.id} | {selectedInPanelPatient.age}y/{selectedInPanelPatient.gender}</p>
                      </div>
                      <div className="text-right">
                        {emergencyToggle && <span className="inline-block bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">EMERGENCY</span>}
                      </div>
                    </div>
                  </div>

                  {/* Patient demographic summary handled in header; doctor-only metadata will be captured during consultation form */}

                  {/* B. Clinical Notes */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Clinical Notes</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Chief Complaint</Label>
                        <Input value={chiefComplaintPanel} onChange={(e) => setChiefComplaintPanel(e.target.value)} disabled={editingLocked} className="text-sm h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Clinical Notes</Label>
                        <Textarea value={modalClinicalNotes} onChange={(e) => setModalClinicalNotes(e.target.value)} rows={3} disabled={editingLocked} className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Provisional Diagnosis</Label>
                        <Input value={provisionalDiagnosis} onChange={(e) => setProvisionalDiagnosis(e.target.value)} disabled={editingLocked} className="text-sm h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Final Diagnosis</Label>
                        <Input value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} disabled={editingLocked} className="text-sm h-8" />
                      </div>
                    </div>
                  </div>

                  {/* C. Test Requirements */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Test Requirements</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {['Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'ECG'].map(test => (
                        <label key={test} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testList.some(t => t.name === test)}
                            onChange={() => {
                              if (!editingLocked) {
                                if (testList.some(t => t.name === test)) {
                                  setTestList(testList.filter(t => t.name !== test));
                                } else {
                                  setTestList([...testList, { name: test, urgency: 'Routine' }]);
                                  updateQueuePatient(selectedInPanelPatient.id, { status: 'Test Ordered' });
                                }
                              }
                            }}
                            disabled={editingLocked}
                          />
                          <span className="text-xs">{test}</span>
                        </label>
                      ))}
                    </div>
                    {testList.length > 0 && (
                      <div className="bg-blue-50 p-2 rounded text-xs space-y-1 mb-2">
                        {testList.map((t, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span>{t.name}</span>
                            <select value={t.urgency} onChange={(e) => setTestList(prev => prev.map((it, idx) => idx === i ? { ...it, urgency: e.target.value } : it))} disabled={editingLocked} className="h-6 px-1 text-xs border rounded">
                              <option>Routine</option>
                              <option>Urgent</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea placeholder="Special Instructions" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} disabled={editingLocked} rows={2} className="text-sm" />
                  </div>

                  {/* D. Bed Requirement */}
                  <div>
                    <Label className="text-sm font-semibold">Bed Requirement</Label>
                    <select
                      value={bedRequirement}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBedRequirement(val);
                        if (val === 'ICU' || val === 'Emergency Ward') {
                          setEmergencyToggle(true);
                          updateQueuePatient(selectedInPanelPatient.id, { priority: 'Emergency' });
                        }
                      }}
                      disabled={editingLocked}
                      className="w-full mt-1 px-2 py-2 border rounded text-sm"
                    >
                      <option>No Admission</option>
                      <option>General Ward</option>
                      <option>Semi-Private</option>
                      <option>Private Room</option>
                      <option>ICU</option>
                      <option>Emergency Ward</option>
                    </select>
                  </div>

                  {/* E. Prescription */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-sm">Prescription</h4>
                      <Button size="sm" variant="outline" onClick={() => setPrescriptionRows([...prescriptionRows, { id: Date.now(), name: '', dosage: '', frequency: '', duration: '', instructions: '' }])} disabled={editingLocked}>Add Row</Button>
                    </div>
                    <div className="bg-gray-50 p-2 rounded space-y-2 max-h-40 overflow-y-auto">
                      {prescriptionRows.map((row) => (
                        <div key={row.id} className="grid grid-cols-5 gap-1 items-center">
                          <Input placeholder="Medicine" value={row.name} onChange={(e) => setPrescriptionRows(rs => rs.map(r => r.id === row.id ? {...r, name: e.target.value} : r))} disabled={editingLocked} className="text-xs h-7" />
                          <Input placeholder="Dosage" value={row.dosage} onChange={(e) => setPrescriptionRows(rs => rs.map(r => r.id === row.id ? {...r, dosage: e.target.value} : r))} disabled={editingLocked} className="text-xs h-7" />
                          <Input placeholder="Frequency" value={row.frequency} onChange={(e) => setPrescriptionRows(rs => rs.map(r => r.id === row.id ? {...r, frequency: e.target.value} : r))} disabled={editingLocked} className="text-xs h-7" />
                          <Input placeholder="Duration" value={row.duration} onChange={(e) => setPrescriptionRows(rs => rs.map(r => r.id === row.id ? {...r, duration: e.target.value} : r))} disabled={editingLocked} className="text-xs h-7" />
                          <Button size="icon" variant="ghost" onClick={() => setPrescriptionRows(rs => rs.filter(r => r.id !== row.id))} disabled={editingLocked} className="h-7 w-7"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* F. Emergency Toggle */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <input type="checkbox" id="emerg" checked={emergencyToggle} onChange={(e) => { setEmergencyToggle(e.target.checked); if (e.target.checked) updateQueuePatient(selectedInPanelPatient.id, { priority: 'Emergency' }); }} disabled={editingLocked} className="cursor-pointer" />
                    <Label htmlFor="emerg" className="text-sm font-semibold cursor-pointer">Emergency - Immediate Attention Required</Label>
                  </div>

                  {/* G. Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => notify.success('Draft saved')}>Save Draft</Button>
                    <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleDashboardPanelSendToNurse} disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send to Nurse'}
                    </Button>
                    <Button size="sm" onClick={() => { updateQueuePatient(selectedInPanelPatient.id, { status: 'Admitted' }); notify.success('Admitted'); }}>Admit Patient</Button>
                    <Button size="sm" onClick={() => { updateQueuePatient(selectedInPanelPatient.id, { status: 'Completed' }); setSelectedInPanelPatient(null); notify.success('Completed'); }}>Mark Completed</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Select a patient to begin consultation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Monitoring tasks */}
      {/* Patients View - All patients list */}
      {currentView === 'patients' && (
        <div className="healthcare-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">All Patients</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadPatients}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {(() => {
              // Filter patients based on search query
              let filteredPatients = patients.filter(patient => {
                if (!searchQuery.trim()) return true;

                const query = searchQuery.toLowerCase();
                return (
                  patient.name.toLowerCase().includes(query) ||
                  (patient.contact && patient.contact.toLowerCase().includes(query)) ||
                  (patient.symptoms && patient.symptoms.toLowerCase().includes(query)) ||
                  (patient.age && patient.age.toString().includes(query)) ||
                  (patient.gender && patient.gender.toLowerCase().includes(query))
                );
              });

              return filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">ID: {patient.id} • {patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} yrs • {patient.gender}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Visit Status: {!patient.patient_registered ? 'Registered' :
                           patient.doctor_notes_completed ? 'Completed' : 'In Progress'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tests Ordered: {patient.tests_required ? 'Yes' : 'No'} • Admission Recommended: {patient.admission_required ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={
                          !patient.patient_registered ? 'pending' :
                          patient.doctor_notes_completed ? 'completed' : 'caution'
                        }
                      >
                        {!patient.patient_registered ? 'Registered' :
                         patient.doctor_notes_completed ? 'Completed' : 'In Progress'}
                      </StatusBadge>
                      <WorkflowProgress patient={patient} />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Consultations View - Patient selector when no patient selected */}
      {currentView === 'consultations' && !selectedPatient && (
        <div className="healthcare-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Select Patient for Consultation</h3>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {patients.filter(p => p.patient_registered && !p.doctor_notes_completed).length > 0 ? (
              patients.filter(p => p.patient_registered && !p.doctor_notes_completed).map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">ID: {patient.id} • {patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} yrs • {patient.gender} • {patient.symptoms || 'No symptoms'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      Consult
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No patients awaiting consultation</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consultations Form - shown after patient is selected */}
      {currentView === 'consultations' && selectedPatient && (
        <div className="space-y-6">
            {/* Patient Header */}
            <div className="healthcare-card">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{selectedPatient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.age} years old • {selectedPatient.gender} • ID: {selectedPatient.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToView('dashboard')}
                    >
                      Back to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <WorkflowProgress patient={selectedPatient} />
              </div>
            </div>

            {/* Clinical Notes Form */}
            <div className="healthcare-card">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Clinical Diagnosis & Notes
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="treatment-notes">Treatment Notes</Label>
                  <Textarea
                    id="treatment-notes"
                    placeholder="Enter treatment plan and notes..."
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="observations">Clinical Observations</Label>
                  <Textarea
                    id="observations"
                    placeholder="Enter clinical observations..."
                    value={clinicalObservations}
                    onChange={(e) => setClinicalObservations(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Tests selection */}
                <div>
                  <Label>Order Tests</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {TEST_OPTIONS.map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={testsOrdered.includes(t)}
                          onChange={() => {
                            const exists = testsOrdered.includes(t);
                            const newList = exists ? testsOrdered.filter(x => x !== t) : [...testsOrdered, t];
                            setTestsOrdered(newList);
                            setTestsRequired(newList.length > 0);
                          }}
                        />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Monitoring tasks */}
                <div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="monitoring-required"
                      checked={monitoringRequired}
                      onCheckedChange={(checked) => setMonitoringRequired(checked === true)}
                    />
                    <Label htmlFor="monitoring-required">Recommend Monitoring</Label>
                  </div>
                      {monitoringRequired && (
                        <div className="mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add monitoring task (e.g., BP every 4 hrs)"
                              value={monitoringTaskInput}
                              onChange={(e) => setMonitoringTaskInput(e.target.value)}
                            />
                            <Button size="sm" onClick={() => {
                              const t = monitoringTaskInput.trim();
                              if (!t) return;
                              setMonitoringTasks(prev => [...prev, t]);
                              setMonitoringTaskInput('');
                            }}>Add</Button>
                          </div>
                          {monitoringTasks.length > 0 && (
                            <ul className="mt-2 list-disc pl-5 text-sm">
                              {monitoringTasks.map((m, i) => (
                                <li key={i} className="flex items-center justify-between">
                                  <span>{m}</span>
                                  <Button size="icon" variant="ghost" onClick={() => setMonitoringTasks(monitoringTasks.filter((_, idx) => idx !== i))}>x</Button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                </div>

                {/* Admission Recommendation */}
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admission-recommended"
                      checked={admissionRecommended}
                      onCheckedChange={(checked) => setAdmissionRecommended(checked === true)}
                    />
                    <Label htmlFor="admission-recommended">Admission Recommended</Label>
                  </div>
                  {admissionRecommended && (
                    <div className="mt-2">
                      <div>
                        <Label htmlFor="admission-reason">Admission Reason</Label>
                        <Textarea
                          id="admission-reason"
                          placeholder="Specify reason for admission..."
                          value={admissionReason}
                          onChange={(e) => setAdmissionReason(e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Room allotment is managed by nursing staff. After you recommend admission, nurses will assign a room.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Test Orders (readonly for doctor) */}
            <div className="mt-3">
              {testOrders.length > 0 ? (
                <div className="healthcare-card p-4">
                  <div className="p-2 border-b border-border mb-2">
                    <h4 className="font-semibold">Existing Test Orders</h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {testOrders.map((t) => (
                      <div key={t.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">{t.test_name}</div>
                            <div className="text-sm text-muted-foreground">{t.test_type} • {t.urgency}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">{t.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                testsRequired && (
                  <p className="text-sm text-muted-foreground">No tests have been created yet for this patient.</p>
                )
              )}
            </div>

            {/* Prescription Form */}
            <div className="healthcare-card">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Prescription
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {medicines.map((medicine, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-border rounded-lg">
                    <div>
                      <Label htmlFor={`medicine-${index}`}>Medicine Name</Label>
                      <Input
                        id={`medicine-${index}`}
                        placeholder="e.g., Paracetamol"
                        value={medicine.name}
                        onChange={(e) => {
                          const newMedicines = [...medicines];
                          newMedicines[index].name = e.target.value;
                          setMedicines(newMedicines);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                      <Input
                        id={`dosage-${index}`}
                        placeholder="e.g., 1-0-1 (morning-noon-night)"
                        value={medicine.dosage}
                        onChange={(e) => {
                          const newMedicines = [...medicines];
                          newMedicines[index].dosage = e.target.value;
                          const dosesPerDay = parseDosageToDosesPerDay(e.target.value);
                          newMedicines[index].total_tablets = (newMedicines[index].days || 0) * dosesPerDay;
                          setMedicines(newMedicines);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`days-${index}`}>Days</Label>
                      <Input
                        id={`days-${index}`}
                        type="number"
                        placeholder="7"
                        value={medicine.days}
                        onChange={(e) => {
                          const newMedicines = [...medicines];
                          newMedicines[index].days = parseInt(e.target.value) || 0;
                          const dosesPerDay = parseDosageToDosesPerDay(newMedicines[index].dosage);
                          newMedicines[index].total_tablets = newMedicines[index].days * dosesPerDay;
                          setMedicines(newMedicines);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`tablets-${index}`}>Total Tablets</Label>
                      <Input
                        id={`tablets-${index}`}
                        type="number"
                        value={medicine.total_tablets}
                        readOnly
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMedicines = medicines.filter((_, i) => i !== index);
                          setMedicines(newMedicines);
                        }}
                        disabled={medicines.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setMedicines([...medicines, { name: '', dosage: '', days: 0, total_tablets: 0 }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPatient(null);
                  navigateToView('dashboard');
                }}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleSaveNotes}
                  disabled={isSubmitting}
                >
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendToPharmacy}
                  disabled={isGenerating}
                >
                  Send to Pharmacy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateAI()}
                  disabled={isGenerating || !clinicalNotes.trim()}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate AI Support'}
                </Button>
                <Button
                  onClick={handleSubmitDoctorNotes}
                  disabled={isSubmitting || !clinicalNotes.trim()}
                >
                  {isSubmitting ? 'Sending...' : 'Send to Nurse'}
                </Button>
              </div>
            </div>

            {/* AI Outputs */}
            {aiOutputs && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="healthcare-card">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Nurse Explanation</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiOutputs.nurse}</p>
                  </div>
                </div>
                <div className="healthcare-card">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Pharmacy Instructions</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiOutputs.pharmacy}</p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Prescriptions View - Prescription management */}
      {currentView === 'prescriptions' && (
        <div className="space-y-6">
          <div className="healthcare-card">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Prescription Management</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review and manage patient prescriptions
              </p>
            </div>
            <div className="divide-y divide-border">
              {patients
                .filter(p => p.doctor_notes_completed)
                .map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} yrs • {patient.gender}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {patient.medicine_dispensed ? 'Dispensed' : 'Pending Dispensing'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={patient.medicine_dispensed ? 'completed' : 'pending'}
                        >
                          {patient.medicine_dispensed ? 'Dispensed' : 'Pending'}
                        </StatusBadge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFinalizePrescription(patient)}
                          disabled={patient.medicine_dispensed}
                        >
                          {patient.medicine_dispensed ? 'Sent to Pharmacy' : 'Finalize & Send to Pharmacy'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {patients.filter(p => p.doctor_notes_completed).length === 0 && (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No prescriptions to manage</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approvals View - Pending approvals */}
      {currentView === 'approvals' && (
        <div className="space-y-6">
          <div className="healthcare-card">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Pending Approvals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Final reports awaiting doctor approval
              </p>
            </div>
            <div className="divide-y divide-border">
              {patients
                .filter(p => p.doctor_notes_completed && !p.doctor_approval_completed && p.nurse_summary_completed)
                .map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-info">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} yrs • {patient.gender}
                          </p>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Clinical Notes (Reference)</p>
                              <p className="text-sm whitespace-pre-wrap">{approvalDataMap[patient.id]?.clinicalNotes || 'Loading...'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Patient-friendly Explanation (Nurse AI)</p>
                              <p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{approvalDataMap[patient.id]?.nurseExplanation || 'Loading...'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Monitoring Instructions</p>
                              <p className="text-sm">{approvalDataMap[patient.id]?.monitoring || 'Loading...'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReportForPatient(patient)}
                          disabled={isSubmitting}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditApprove(patient)}
                        >
                          Edit & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectReport(patient)}
                        >
                          Reject & Send Back
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {patients.filter(p => p.doctor_notes_completed && !p.doctor_approval_completed && p.nurse_summary_completed).length === 0 && (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Alerts Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={isSubmitting}
            size="sm"
            variant="destructive"
            className="gap-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-3 h-3" />
            Delete All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinical Notes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete these clinical notes? This action cannot be undone and will reset the patient workflow. All changes will be immediately visible in nurse and pharmacist portals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClinicalNotes} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Patient History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Medical History for {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient ? (
              <div className="space-y-4">
                {/* Patient Demographics */}
                <div className="healthcare-card p-4">
                  <h4 className="font-semibold text-foreground mb-3">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-2 font-medium">{selectedPatient.age} years</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="ml-2 font-medium">{selectedPatient.gender}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="ml-2 font-medium">{selectedPatient.contact}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registration:</span>
                      <span className="ml-2 font-medium">
                        {selectedPatient.patient_registered ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workflow Status */}
                <div className="healthcare-card p-4">
                  <h4 className="font-semibold text-foreground mb-3">Treatment Progress</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Doctor Consultation:</span>
                      <span className={selectedPatient.doctor_notes_completed ? 'text-success' : 'text-warning'}>
                        {selectedPatient.doctor_notes_completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nurse Explanation:</span>
                      <span className={selectedPatient.nurse_summary_completed ? 'text-success' : 'text-muted-foreground'}>
                        {selectedPatient.nurse_summary_completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pharmacy Dispensing:</span>
                      <span className={selectedPatient.medicine_dispensed ? 'text-success' : 'text-muted-foreground'}>
                        {selectedPatient.medicine_dispensed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctor Approval:</span>
                      <span className={selectedPatient.doctor_approval_completed ? 'text-success' : 'text-muted-foreground'}>
                        {selectedPatient.doctor_approval_completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes History */}
                {selectedPatient.doctor_notes_completed && consultationHistory.length > 0 && (
                  <div className="healthcare-card p-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Consultation Records ({consultationHistory.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {consultationHistory.map((record) => (
                        <div
                          key={record.id}
                          onClick={() => loadConsultationRecord(record)}
                          className={cn(
                            "p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                            selectedConsultationRecord === record.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                {record.created_at ? new Date(record.created_at).toLocaleString() : 'Unknown Date'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                <div className="truncate">{record.clinical_notes.substring(0, 60)}...</div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {record.tests_required && record.tests_ordered?.length > 0 && (
                                  <div>Tests: {record.tests_ordered.join(', ')}</div>
                                )}
                                {record.admission_recommended && (
                                  <div>Admission: Pending (nurse assigns room)</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadConsultationRecord(record)}
                                className="text-xs"
                              >
                                Load
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placeholder for future medical history */}
                <div className="healthcare-card p-4">
                  <h4 className="font-semibold text-foreground mb-3">Medical History</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Comprehensive medical history will be available in future updates.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Select a patient to view medical history.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
