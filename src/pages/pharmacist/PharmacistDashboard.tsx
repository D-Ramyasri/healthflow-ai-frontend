import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Pill, FileText, AlertTriangle, CheckCircle, Package,
  Eye, Printer, Clock, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { WorkflowProgress } from '@/components/ui/WorkflowProgress';
import { getPharmacistPatients, dispenseMedicine, getClinicalNotes } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types/healthcare';
import { notify } from '@/lib/notify';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const prescriptions = [
  { 
    id: '1', 
    patient: 'John Smith',
    doctor: 'Dr. Chen',
    time: '10:45 AM',
    status: 'pending',
    priority: 'high',
    medicineCount: 3
  },
  { 
    id: '2', 
    patient: 'Mary Johnson',
    doctor: 'Dr. Williams',
    time: '11:30 AM',
    status: 'dispensed',
    priority: 'normal',
    medicineCount: 2
  },
  { 
    id: '3', 
    patient: 'Robert Brown',
    doctor: 'Dr. Chen',
    time: '12:15 PM',
    status: 'pending',
    priority: 'normal',
    medicineCount: 1
  },
];

type SafetyLevel = 'safe' | 'caution';

const sampleMedications: {
  id: string;
  name: string;
  dosageSchedule: string;
  foodRestrictions: string;
  duration: string;
  sideEffects: string;
  safetyLevel: SafetyLevel;
  available: boolean;
  quantity: number;
}[] = [
  {
    id: '1',
    name: 'Aspirin 81mg',
    dosageSchedule: 'Once daily with breakfast',
    foodRestrictions: 'Take with food, avoid on empty stomach',
    duration: '30 days',
    sideEffects: 'May cause stomach upset, nausea',
    safetyLevel: 'safe',
    available: true,
    quantity: 30
  },
  {
    id: '2',
    name: 'Metoprolol 25mg',
    dosageSchedule: 'Twice daily (morning and evening)',
    foodRestrictions: 'Can be taken with or without food',
    duration: '30 days',
    sideEffects: 'Dizziness, fatigue, cold hands/feet',
    safetyLevel: 'caution',
    available: true,
    quantity: 60
  },
  {
    id: '3',
    name: 'Lisinopril 10mg',
    dosageSchedule: 'Once daily in the morning',
    foodRestrictions: 'Avoid potassium-rich foods',
    duration: '30 days',
    sideEffects: 'Dry cough, dizziness',
    safetyLevel: 'safe',
    available: false,
    quantity: 0
  }
];

type AlertSeverity = 'safe' | 'caution';

const safetyAlerts: { type: string; message: string; severity: AlertSeverity }[] = [
  { type: 'allergy', message: 'No known allergies on file', severity: 'safe' },
  { type: 'interaction', message: 'Minor interaction: Aspirin + Metoprolol (monitor)', severity: 'caution' },
];

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState<any>(null);
  const [loadingClinicalNotes, setLoadingClinicalNotes] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dispensedMeds, setDispensedMeds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const loadClinicalNotes = async (patientId: number) => {
    try {
      setLoadingClinicalNotes(true);
      console.log('Loading clinical notes for patient:', patientId);
      const notes = await getClinicalNotes(patientId, 'pharmacist');
      console.log('Clinical notes loaded:', notes);
      setClinicalNotes(notes);
    } catch (error) {
      console.error('Failed to load clinical notes:', error);
      setClinicalNotes(null);
    } finally {
      setLoadingClinicalNotes(false);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientData = await getPharmacistPatients();
      setPatients(patientData);
      return patientData;
    } catch (error) {
      notify.error('Failed to load patients', 'Unable to load patients. Please try again.');
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Handle routing based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/pharmacist/prescriptions') {
      setCurrentView('prescriptions');
    } else if (path === '/pharmacist/dispensing') {
      setCurrentView('dispensing');
    } else if (path === '/pharmacist/inventory') {
      setCurrentView('inventory');
    } else {
      setCurrentView('dashboard');
    }
  }, [location.pathname]);

  const handleDispenseMedicine = async () => {
    if (!selectedPatient) return;

    setIsDispensing(true);
    try {
      await dispenseMedicine({
        patient_id: selectedPatient.id,
        pharmacist_notes: '',
      }, 'pharmacist');
      notify.success('Medicine dispensed successfully');
      const patientData = await loadPatients();
      const updatedPatient = patientData?.find(p => p.id === selectedPatient.id);
      if (updatedPatient) setSelectedPatient(updatedPatient);
    } catch (error) {
      notify.error('Failed to dispense medicine', 'Unable to dispense medicine.');
      console.error('Error dispensing medicine:', error);
    } finally {
      setIsDispensing(false);
    }
  };

  const toggleMedDispensed = (medId: string) => {
    setDispensedMeds(prev =>
      prev.includes(medId)
        ? prev.filter(id => id !== medId)
        : [...prev, medId]
    );
  };

  // Derive medications to show: prefer clinical notes prescription, fallback to sample data
  // Normalize prescription_json to array if object
  let normalizedPrescriptions: any[] = [];
  if (clinicalNotes && clinicalNotes.prescription_json) {
    if (Array.isArray(clinicalNotes.prescription_json)) {
      normalizedPrescriptions = clinicalNotes.prescription_json;
    } else if (typeof clinicalNotes.prescription_json === 'object') {
      normalizedPrescriptions = Object.entries(clinicalNotes.prescription_json).map(([name, dosage]) => ({ name, dosage }));
    }
  }
  const medsToShow = normalizedPrescriptions.length > 0
    ? normalizedPrescriptions.map((it: any, idx: number) => {
        const name = it.name || it.medication || `Medicine ${idx + 1}`;
        // Support multiple possible field names from different doctor UIs / AI outputs
        const dosageSchedule = it.dosage || it.dosageSchedule || it.schedule || '';
        const duration = it.days ? `${it.days} days` : (it.duration || it.duration_days || '');
        const quantity = it.total_tablets || it.quantity || it.qty || 0;
        const foodRestrictions = it.foodRestrictions || it.food || it.instructions?.food || 'N/A';
        const sideEffects = it.sideEffects || it.side_effects || it.adverse_effects || '';
        const available = typeof it.available === 'boolean' ? it.available : (quantity > 0 ? true : true);

        // Simple safety heuristic: prefer explicit safetyLevel, else mark as 'caution' for known classes
        const nameLower = String(name).toLowerCase();
        const cautionKeywords = ['metoprolol', 'lisinopril', 'warfarin', 'ibuprofen', 'naproxen', 'aspirin'];
        const safetyLevel: SafetyLevel = (it.safetyLevel as SafetyLevel) || (cautionKeywords.some(k => nameLower.includes(k)) ? 'caution' : 'safe');

        return {
          id: it.id ? String(it.id) : `pres-${idx}`,
          name,
          dosageSchedule,
          foodRestrictions,
          duration,
          sideEffects,
          safetyLevel,
          available,
          quantity,
        };
      })
    : sampleMedications;

  const allMedsDispensed = medsToShow.filter((m: any) => m.available).every((m: any) => dispensedMeds.includes(m.id));

  const getPageTitle = () => {
    switch (currentView) {
      case 'prescriptions': return 'Prescriptions';
      case 'dispensing': return 'Dispensing';
      case 'inventory': return 'Inventory';
      default: return 'Pharmacist Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (currentView) {
      case 'prescriptions': return 'Review and verify prescriptions';
      case 'dispensing': return 'Medication dispensing and verification';
      case 'inventory': return 'Manage medication inventory';
      default: return 'Medication verification and dispensing';
    }
  };

  // Sync view from URL query param so sidebar links can open subviews on the same page
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const view = qp.get('view') || 'dashboard';
    setCurrentView(view);
  }, [location.search]);

  return (
    <DashboardLayout title={getPageTitle()} subtitle={getPageSubtitle()}>
      {currentView === 'dashboard' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="healthcare-card p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{patients.length}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Patients</p>
        </div>
        <div className="healthcare-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-2xl font-bold text-foreground">
              {patients.filter(p => p.doctor_approval_completed && !p.medicine_dispensed).length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Ready for Dispensing</p>
        </div>
        <div className="healthcare-card p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-foreground">
              {patients.filter(p => p.medicine_dispensed).length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Dispensed Today</p>
        </div>
        <div className="healthcare-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="text-2xl font-bold text-foreground">1</span>
          </div>
          <p className="text-sm text-muted-foreground">Safety Alerts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="healthcare-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Patients</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadPatients}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatient(patient);
                    loadClinicalNotes(patient.id);
                    setDispensedMeds([]); // Reset dispensed meds for new patient
                    setShowPatientDetails(false); // Reset details view for new patient
                  }}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200 mb-2",
                    selectedPatient?.id === patient.id
                      ? "bg-warning/10 border border-warning/30"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">{patient.name}</span>
                    {!patient.doctor_approval_completed && (
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                    {patient.doctor_approval_completed && !patient.medicine_dispensed && (
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    )}
                    {patient.medicine_dispensed && (
                      <span className="w-2 h-2 rounded-full bg-success" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {patient.age} yrs • {patient.symptoms || 'No symptoms'}
                  </p>
                  <div className="w-full">
                    <WorkflowProgress patient={patient} compact />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <StatusBadge status={
                      patient.medicine_dispensed ? 'completed' :
                      patient.doctor_approval_completed ? 'pending' : 'inactive'
                    }>
                      {patient.medicine_dispensed ? 'Dispensed' :
                       patient.doctor_approval_completed ? 'Ready' : 'Waiting'}
                    </StatusBadge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Medication Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <div className="healthcare-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-warning">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedPatient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.contact}
                    </p>
                    {selectedPatient.symptoms && (
                      <p className="text-sm text-muted-foreground">
                        Symptoms: {selectedPatient.symptoms}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowPatientDetails(!showPatientDetails)}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                </div>
              </div>

              {/* Safety Alerts */}
              <div className="healthcare-card p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning" />
                  Drug Safety Alerts
                </h4>
                <div className="space-y-2">
                  {safetyAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        alert.severity === 'safe' && "bg-success/5 border border-success/20",
                        alert.severity === 'caution' && "bg-warning/5 border border-warning/20"
                      )}
                    >
                      {alert.severity === 'safe' && <CheckCircle className="w-4 h-4 text-success" />}
                      {alert.severity === 'caution' && <AlertTriangle className="w-4 h-4 text-warning" />}
                      <span className="text-sm text-foreground">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Patient Information */}
              {showPatientDetails && (
                <div className="healthcare-card p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Patient Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Personal Information</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="text-foreground">{selectedPatient.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Age:</span>
                          <span className="text-foreground">{selectedPatient.age} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gender:</span>
                          <span className="text-foreground">{selectedPatient.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact:</span>
                          <span className="text-foreground">{selectedPatient.contact}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Medical Information</h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Symptoms:</span>
                          <p className="text-foreground mt-1">{selectedPatient.symptoms || 'Not specified'}</p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preferred Language:</span>
                          <span className="text-foreground">{selectedPatient.preferred_language || 'English'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registration Date:</span>
                          <span className="text-foreground">
                            {selectedPatient.registered_at ? new Date(selectedPatient.registered_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Doctor's Clinical Notes */}
                  {clinicalNotes && clinicalNotes.clinical_notes && (
                    <div className="mt-4">
                      <h5 className="font-medium text-foreground mb-2">Doctor's Notes</h5>
                      <div className="healthcare-card p-4">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                          {clinicalNotes.clinical_notes}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Debug info */}
                  {selectedPatient && (
                    <div className="mt-4 p-2 bg-gray-100 text-xs">
                      Debug: clinicalNotes exists: {clinicalNotes ? 'Yes' : 'No'},
                      loading: {loadingClinicalNotes ? 'Yes' : 'No'},
                      clinical_notes: {clinicalNotes?.clinical_notes ? 'Yes' : 'No'},
                      prescription_json: {clinicalNotes?.prescription_json ? 'Yes' : 'No'}
                    </div>
                  )}

                  {/* Prescription Details */}
                  {clinicalNotes && clinicalNotes.prescription_json && (
                    <div className="mt-4">
                      <h5 className="font-medium text-foreground mb-2">Prescription Details</h5>
                      <div className="space-y-3">
                        {Array.isArray(clinicalNotes.prescription_json) 
                          ? clinicalNotes.prescription_json.map((item: any, index: number) => (
                              <div key={index} className="healthcare-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h6 className="font-medium text-foreground">{item.name}</h6>
                                  <span className="text-sm text-muted-foreground">Total: {item.total_tablets} tablets</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Dosage: {item.dosage} • Duration: {item.days} days
                                </div>
                              </div>
                            ))
                          : Object.entries(clinicalNotes.prescription_json).map(([name, details]: [string, any], index: number) => (
                              <div key={index} className="healthcare-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h6 className="font-medium text-foreground">{name}</h6>
                                  <span className="text-sm text-muted-foreground">Details: {details}</span>
                                </div>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h5 className="font-medium text-foreground mb-2">Workflow Status</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className={cn(
                        "p-2 rounded text-xs text-center",
                        selectedPatient.patient_registered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        Registration
                      </div>
                      <div className={cn(
                        "p-2 rounded text-xs text-center",
                        selectedPatient.doctor_notes_completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        Doctor Notes
                      </div>
                      <div className={cn(
                        "p-2 rounded text-xs text-center",
                        selectedPatient.nurse_summary_completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        Nurse Summary
                      </div>
                      <div className={cn(
                        "p-2 rounded text-xs text-center",
                        selectedPatient.doctor_approval_completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        Doctor Approval
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medication List - Only show when doctor approval is completed */}
              {selectedPatient.doctor_approval_completed && !selectedPatient.medicine_dispensed && (
                <div className="healthcare-card">
                  <div className="p-4 border-b border-border">
                    <h4 className="font-semibold text-foreground">Medication Instructions</h4>
                  </div>
                  <div className="divide-y divide-border">
                    <TooltipProvider>
                      {medsToShow.map((med: any) => (
                      <div key={med.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => med.available && toggleMedDispensed(med.id)}
                              disabled={!med.available}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                dispensedMeds.includes(med.id)
                                  ? "bg-success border-success text-success-foreground"
                                  : med.available
                                    ? "border-muted-foreground hover:border-primary"
                                    : "border-muted bg-muted cursor-not-allowed"
                              )}
                            >
                              {dispensedMeds.includes(med.id) && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <h5 className="font-medium text-foreground">{med.name}</h5>
                              <p className="text-xs text-muted-foreground">{med.dosageSchedule}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={med.safetyLevel}>
                              {med.safetyLevel === 'safe' ? 'Safe' : 'Caution'}
                            </StatusBadge>
                            {!med.available && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-9 grid grid-cols-2 gap-4 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="ml-2 text-foreground">{med.duration}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Complete the full course as prescribed</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <span className="text-muted-foreground">Qty:</span>
                                <span className="ml-2 text-foreground">{med.quantity || 'N/A'}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total tablets to dispense</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Food:</span>
                            <span className="ml-2 text-foreground">{med.foodRestrictions}</span>
                          </div>
                          
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Side Effects:</span>
                            <span className="ml-2 text-foreground">{med.sideEffects}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
              )}

              {/* Show waiting message when doctor approval is not completed */}
              {!selectedPatient.doctor_approval_completed && (
                <div className="healthcare-card p-6 border-2 border-warning/30 bg-warning/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-warning" />
                    <div>
                      <h4 className="font-semibold text-foreground">Waiting for Doctor Approval</h4>
                      <p className="text-sm text-muted-foreground">
                        Medication dispensing is only available after the doctor has completed their notes and approved the treatment plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medication Timeline - Only show when doctor approval is completed */}
              {selectedPatient.doctor_approval_completed && !selectedPatient.medicine_dispensed && (
                <div className="healthcare-card p-4">
                  <h4 className="font-semibold text-foreground mb-4">Medication Schedule</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map((time, i) => (
                    <div key={time} className="flex-shrink-0 text-center">
                      <div className={cn(
                        "w-16 h-16 rounded-lg flex items-center justify-center mb-2",
                        (i === 0 || i === 2) ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Pill className={cn(
                          "w-6 h-6",
                          (i === 0 || i === 2) ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className="text-xs text-muted-foreground">{time}</span>
                      {(i === 0 || i === 2) && (
                        <p className="text-xs font-medium text-primary">2 meds</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Action Buttons - Only show when doctor approval is completed */}
              {selectedPatient.doctor_approval_completed && !selectedPatient.medicine_dispensed && (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2">
                    <Package className="w-4 h-4" />
                    Check Availability
                  </Button>
                  <Button
                    onClick={handleDispenseMedicine}
                    disabled={isDispensing || !allMedsDispensed}
                    className="gap-2"
                  >
                    {isDispensing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Dispensing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Confirm Dispensing
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print Instructions
                  </Button>
                </div>
              )}

              {/* Show dispensing status */}
              {selectedPatient.medicine_dispensed && (
                <div className="healthcare-card p-6 border-2 border-success/30 bg-success/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-success" />
                    <div>
                      <h4 className="font-semibold text-foreground">Medicine Dispensed</h4>
                      <p className="text-sm text-muted-foreground">
                        All medications have been successfully dispensed for this patient
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Popup */}
              {showConfirmation && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm fade-in">
                  <div className="healthcare-card-elevated p-8 scale-in text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Dispensing Complete!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Medications have been successfully dispensed for {selectedPatient.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="healthcare-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select a Patient
              </h3>
              <p className="text-muted-foreground">
                Choose a patient from the list to view medication details
              </p>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {currentView === 'prescriptions' && (
        <div className="space-y-6">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <div className="healthcare-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-warning">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedPatient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.contact}
                    </p>
                  </div>
                </div>
                <StatusBadge status={
                  selectedPatient.medicine_dispensed ? 'completed' :
                  selectedPatient.doctor_approval_completed ? 'pending' : 'inactive'
                }>
                  {selectedPatient.medicine_dispensed ? 'Dispensed' :
                   selectedPatient.doctor_approval_completed ? 'Ready for Dispensing' : 'Waiting for Approval'}
                </StatusBadge>
              </div>

              {/* Doctor's Clinical Notes */}
              {clinicalNotes && clinicalNotes.clinical_notes && (
                <div className="healthcare-card">
                  <div className="p-4 border-b border-border">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Doctor's Notes
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                        {clinicalNotes.clinical_notes}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Display */}
              {clinicalNotes && clinicalNotes.prescription_json && (
                <div className="healthcare-card">
                  <div className="p-4 border-b border-border">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Prescription Details
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {normalizedPrescriptions.map((item: any, index: number) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-foreground">{item.name}</h5>
                            <span className="text-sm text-muted-foreground">Total: {item.total_tablets} tablets</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Dosage: {item.dosage} • Duration: {item.days} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dispense Button */}
              {selectedPatient.doctor_approval_completed && !selectedPatient.medicine_dispensed && (
                <div className="healthcare-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">Ready for Dispensing</h4>
                      <p className="text-sm text-muted-foreground">Confirm medicine dispensing</p>
                    </div>
                    <Button
                      onClick={handleDispenseMedicine}
                      disabled={isDispensing}
                      className="bg-warning hover:bg-warning/90"
                    >
                      {isDispensing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Dispensing...
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 mr-2" />
                          Dispense Medicine
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="healthcare-card p-8 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a Patient</h3>
              <p className="text-muted-foreground">Choose a patient from the list to view prescription details</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'dispensing' && (
        <div className="space-y-6">
          <div className="healthcare-card p-4">
            <h3 className="font-semibold text-foreground mb-2">Patients Ready for Dispensing</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Patient</th>
                    <th className="px-4 py-2 text-left">Contact</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.filter(p => p.doctor_approval_completed).map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">{p.contact}</td>
                      <td className="px-4 py-2">{p.medicine_dispensed ? 'Dispensed' : 'Ready'}</td>
                      <td className="px-4 py-2">
                        <Button size="sm" onClick={() => { setSelectedPatient(p); setCurrentView('prescriptions'); }}>
                          View Prescription
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentView === 'inventory' && (
        <div className="healthcare-card p-4">
          <h3 className="font-semibold text-foreground mb-2">Inventory</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-background">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Medicine</th>
                  <th className="px-4 py-2 text-left">Dosage</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                </tr>
              </thead>
              <tbody>
                {sampleMedications.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.dosageSchedule}</td>
                    <td className="px-4 py-2">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
