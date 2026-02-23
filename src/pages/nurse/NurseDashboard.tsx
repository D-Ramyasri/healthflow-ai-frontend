import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, Heart, Eye, Clock, CheckCircle, Send,
  AlertTriangle, Plus, FileText, RefreshCw, Activity, Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { WorkflowProgress } from '@/components/ui/WorkflowProgress';
import { AIProcessingLoader } from '@/components/ui/AIProcessingLoader';
import { getNursePatients, submitNurseSummary, generateFreshNurseExplanation, getClinicalNotes, getPatientTests, updateTestStatus, getPatientMonitoringTasks, updateMonitoringTask, getPatientRoomAllotment, updateRoomAllotment, getNurseAIExplanations, getPatientsWithDoctorNotes } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, TestOrder, MonitoringTask, RoomAllotment, ClinicalNotesExtended } from '@/types/healthcare';
import { notify } from '@/lib/notify';

const monitoringChecklist = [
  { id: '1', task: 'Check vital signs', completed: true },
  { id: '2', task: 'Administer medication', completed: true },
  { id: '3', task: 'Review patient comfort', completed: false },
  { id: '4', task: 'Document observations', completed: false },
  { id: '5', task: 'Patient education complete', completed: false },
];

const sampleExplanation = {
  diseaseExplanation: "Your condition is related to your heart and blood vessels. The symptoms you're experiencing are your body's way of signaling that your heart needs some extra support.",
  bodyCondition: "Currently, your heart is working harder than normal to pump blood. This is why you might feel tired or short of breath during activities.",
  recoveryExpectations: "With proper medication and lifestyle changes, most patients see improvement within 2-4 weeks. Full recovery depends on following the treatment plan.",
  lifestyleGuidance: "• Reduce salt intake to less than 2g per day\n• Light walking for 15-20 minutes daily\n• Get 7-8 hours of sleep\n• Avoid stressful situations when possible",
  warningSymptoms: [
    "Sudden chest pain that doesn't go away",
    "Difficulty breathing while resting",
    "Swelling in legs or ankles",
    "Unusual fatigue or dizziness"
  ]
};

export default function NurseDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [checklist, setChecklist] = useState(monitoringChecklist);
  const [additionalGuidance, setAdditionalGuidance] = useState('');
  const [comprehensionNotes, setComprehensionNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState<any>(null);
  const [aiGeneratedList, setAiGeneratedList] = useState<any[]>([]);
  const [doctorSentPatients, setDoctorSentPatients] = useState<any[]>([]);
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [monitoringTasks, setMonitoringTasks] = useState<MonitoringTask[]>([]);
  const [roomAllotment, setRoomAllotment] = useState<RoomAllotment | null>(null);
  const [clinicalNotesExtended, setClinicalNotesExtended] = useState<ClinicalNotesExtended | null>(null);

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      (patient.symptoms && patient.symptoms.toLowerCase().includes(query)) ||
      (patient.contact && patient.contact.toLowerCase().includes(query)) ||
      (patient.age && patient.age.toString().includes(query))
    );
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientData = await getNursePatients();
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

  const loadAiGeneratedList = async (patientId?: number) => {
    try {
      const list = await getNurseAIExplanations(patientId);
      setAiGeneratedList(list || []);
    } catch (error) {
      console.warn('Failed to load AI explanations list:', error);
      setAiGeneratedList([]);
    }
  };

  // Reload AI list when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      loadAiGeneratedList(selectedPatient.id);
    } else {
      // No patient selected — show empty list (never load unfiltered data)
      setAiGeneratedList([]);
    }
  }, [selectedPatient?.id]);

  const loadDoctorSentPatients = async () => {
    try {
      const list = await getPatientsWithDoctorNotes();
      setDoctorSentPatients(list || []);
    } catch (error) {
      console.warn('Failed to load doctor-sent patients:', error);
      setDoctorSentPatients([]);
    }
  };

  useEffect(() => {
    loadDoctorSentPatients();
  }, []);

  // Listen for workflow update events (dispatched from DashboardLayout when notifications arrive)
  useEffect(() => {
    const handler = (e: any) => {
      // Simple refresh on relevant workflow updates
      if (e?.detail?.type === 'doctor.notes_complete' || e?.detail?.type === 'consultation') {
        loadPatients();
      }
    };
    window.addEventListener('workflow:update', handler as EventListener);
    return () => window.removeEventListener('workflow:update', handler as EventListener);
  }, []);

  // Handle routing based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/nurse/patients') {
      setCurrentView('patients');
    } else if (path === '/nurse/explanations') {
      setCurrentView('explanations');
    } else if (path === '/nurse/monitoring') {
      setCurrentView('monitoring');
    } else {
      setCurrentView('dashboard');
    }
  }, [location.pathname]);

  const loadClinicalNotes = async (patientId: number) => {
    try {
      const notes = await getClinicalNotes(patientId, 'nurse');
      console.log('Nurse: loaded clinical notes for', patientId, notes);
      // Normalize notes: if `clinical_notes` is empty, prefer diagnosis or treatment
      const normalized = {
        ...notes,
        clinical_notes: (notes && (notes.clinical_notes || notes.diagnosis || notes.treatment)) || '',
      };

      // Ensure prescription_json is an array (handle legacy string or object values)
      try {
        if (normalized.prescription_json && !Array.isArray(normalized.prescription_json)) {
          if (typeof normalized.prescription_json === 'string') {
            try {
              const parsed = JSON.parse(normalized.prescription_json);
              normalized.prescription_json = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              normalized.prescription_json = [normalized.prescription_json];
            }
          } else if (typeof normalized.prescription_json === 'object') {
            normalized.prescription_json = [normalized.prescription_json];
          } else {
            normalized.prescription_json = [];
          }
        }
      } catch (e) {
        normalized.prescription_json = [];
      }

      // Ensure tests and monitoring arrays are arrays
      if (normalized.tests_ordered && !Array.isArray(normalized.tests_ordered)) {
        normalized.tests_ordered = typeof normalized.tests_ordered === 'string' ? [normalized.tests_ordered] : [];
      }
      if (normalized.monitoring_tasks && !Array.isArray(normalized.monitoring_tasks)) {
        normalized.monitoring_tasks = typeof normalized.monitoring_tasks === 'string' ? [normalized.monitoring_tasks] : [];
      }
      setClinicalNotes(normalized);

      // Load extended clinical notes (with workflow controls)
      setClinicalNotesExtended({
        id: notes.id || 0,
        patient_id: patientId,
        clinical_notes: notes.clinical_notes || '',
        prescription_json: notes.prescription_json || [],
        doctor_approved: notes.doctor_approved || false,
        tests_required: notes.tests_required || false,
        monitoring_required: notes.monitoring_required || false,
        admission_recommended: notes.admission_recommended || false,
      });

      // Load controlled workflow sections
      try {
        await loadTestOrders(patientId);
      } catch (error) {
        console.error('Failed to load clinical notes for', patientId, error);
        notify.error('Failed to load clinical notes', String(error));

        // Retry once to handle transient auth/network issues
        try {
          const notesRetry = await getClinicalNotes(patientId, 'nurse');
          console.log('Retry succeeded loading clinical notes for', patientId, notesRetry);
          const normalizedRetry = {
            ...notesRetry,
            clinical_notes: (notesRetry && (notesRetry.clinical_notes || notesRetry.diagnosis || notesRetry.treatment)) || '',
          };
          setClinicalNotes(normalizedRetry);
          return;
        } catch (retryErr) {
          console.error('Retry failed for clinical notes:', retryErr);
        }

        // Set empty clinical notes instead of showing error
        setClinicalNotes({
          id: null,
          patient_id: patientId,
          clinical_notes: '',
          diagnosis: '',
          treatment: '',
          prescription_json: [],
          doctor_approved: false,
        });
      }
    } catch (error) {
      console.warn('Failed to load clinical notes, using empty state:', error);
      // Set empty clinical notes instead of showing error
      setClinicalNotes({
        id: null,
        patient_id: patientId,
        clinical_notes: '',
        diagnosis: '',
        treatment: '',
        prescription_json: [],
        doctor_approved: false,
      });
      setClinicalNotesExtended({
        id: 0,
        patient_id: patientId,
        clinical_notes: '',
        prescription_json: [],
        doctor_approved: false,
        tests_required: false,
        monitoring_required: false,
        admission_recommended: false,
      });
    }
  };

  const loadTestOrders = async (patientId: number) => {
    try {
      const tests = await getPatientTests(patientId, 'nurse');
      setTestOrders(tests);
    } catch (error) {
      console.error('Error loading test orders:', error);
      setTestOrders([]);
    }
  };

  const loadMonitoringTasks = async (patientId: number) => {
    try {
      const tasks = await getPatientMonitoringTasks(patientId, 'nurse');
      setMonitoringTasks(tasks);
    } catch (error) {
      console.error('Error loading monitoring tasks:', error);
      setMonitoringTasks([]);
    }
  };

  const loadRoomAllotment = async (patientId: number) => {
    try {
      const allotment = await getPatientRoomAllotment(patientId, 'nurse');
      setRoomAllotment(allotment);
    } catch (error) {
      console.error('Error loading room allotment:', error);
      setRoomAllotment(null);
    }
  };

  const toggleTask = (taskId: string) => {
    setChecklist(checklist.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleSubmitNurseSummary = async () => {
    if (!selectedPatient) return;

    setIsSending(true);
    try {
      // Use AI-generated explanation if available, otherwise fall back to sample text
      const explanationToSend = aiExplanation?.trim() ? aiExplanation : sampleExplanation.diseaseExplanation;
      await submitNurseSummary({
        patient_id: selectedPatient.id,
        care_instructions: explanationToSend,
        additional_notes: additionalGuidance,
      });

      notify.success('Nurse summary submitted successfully');
      const patientData = await loadPatients();
      const updatedPatient = patientData?.find(p => p.id === selectedPatient.id);
      if (updatedPatient) setSelectedPatient(updatedPatient);
    } catch (error) {
      notify.error('Failed to submit nurse summary', 'Unable to submit nurse summary.');
      console.error('Error submitting nurse summary:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedPatient) return;

    setIsGeneratingAI(true);
    try {
      // Fetch fresh clinical notes for this patient to avoid using stale state
      const freshNotes = await getClinicalNotes(selectedPatient.id, 'nurse').catch(() => null);

      // Send patient_id + clinical_notes_id so backend can gather ALL doctor data
      const payload: any = { patient_id: selectedPatient.id };
      if (freshNotes && freshNotes.id) payload.clinical_notes_id = freshNotes.id;
      if (freshNotes && freshNotes.clinical_notes) payload.clinical_notes = freshNotes.clinical_notes;
      else if (selectedPatient.symptoms) payload.clinical_notes = selectedPatient.symptoms;

      // Clear previous AI state before generating new response
      setAiExplanation('');
      setAiPrompt('');

      // Call the new endpoint that returns both prompt and response
      const result = await generateFreshNurseExplanation(payload, 'nurse', user?.id);
      setAiExplanation(result.response || result.nurse_explanation || '');
      setAiPrompt(result.prompt || '');
      // Refresh list of generated explanations for this patient
      try { await loadAiGeneratedList(selectedPatient.id); } catch {}
      notify.success('AI explanation generated from complete doctor assessment');
    } catch (error) {
      let errorMessage = 'Unable to generate AI explanation.';
      let errorDetail = '';
      
      // Extract more detailed error information
      if (error instanceof Error) {
        errorDetail = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('detail' in error) {
          errorDetail = String((error as any).detail);
        } else if ('message' in error) {
          errorDetail = String((error as any).message);
        }
      }
      
      // Provide specific guidance based on error type
      if (errorDetail.includes('model') || errorDetail.includes('Model') || errorDetail.includes('503')) {
        errorMessage = 'AI model is not available. The system is initializing the AI model, which may take a few minutes on first startup.';
      } else if (errorDetail.includes('clinical notes') || errorDetail.includes('404')) {
        errorMessage = 'Unable to find clinical notes for this patient. Please ensure a doctor has completed the assessment first.';
      } else if (errorDetail.includes('Doctor notes')) {
        errorMessage = 'Doctor notes must be completed before generating an explanation.';
      }
      
      notify.error('Failed to generate AI explanation', errorMessage);
      console.error('Error generating AI explanation:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'patients': return 'Assigned Patients';
      case 'explanations': return 'Condition Explanations';
      case 'monitoring': return 'Monitoring Tasks';
      default: return 'Nurse Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (currentView) {
      case 'patients': return 'Manage patient assignments and care';
      case 'explanations': return 'Patient education and condition understanding';
      case 'monitoring': return 'Track patient progress and vital signs';
      default: return 'Patient care and condition education';
    }
  };

  // Calculate progress for monitoring checklist
  const completedTasks = checklist.filter(task => task.completed).length;
  const progressPercent = checklist.length > 0 ? (completedTasks / checklist.length) * 100 : 0;

  return (
    <DashboardLayout 
      title={getPageTitle()} 
      subtitle={getPageSubtitle()}
      searchQuery={searchTerm}
      onSearchChange={setSearchTerm}
      showSearch={currentView === 'dashboard' || currentView === 'patients'}
    >
      {currentView === 'dashboard' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="healthcare-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{patients.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Assigned Patients</p>
            </div>
            <div className="healthcare-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold text-foreground">
                  {patients.filter(p => p.doctor_notes_completed && !p.nurse_summary_completed).length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Pending Care Plans</p>
            </div>
            <div className="healthcare-card p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold text-foreground">
                  {patients.filter(p => p.nurse_summary_completed).length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Completed Care Plans</p>
            </div>
            <div className="healthcare-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-danger" />
                <span className="text-2xl font-bold text-foreground">1</span>
              </div>
              <p className="text-sm text-muted-foreground">Critical Care</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="healthcare-card">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Assigned Patients</h3>
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
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        loadClinicalNotes(patient.id);
                        setChecklist(monitoringChecklist); // Reset checklist for new patient
                        setAdditionalGuidance('');
                        setComprehensionNotes('');
                        setAiExplanation(''); // Reset AI state for new patient
                        setAiGeneratedList([]); // Clear stale list immediately
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all duration-200 mb-2",
                        selectedPatient?.id === patient.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">{patient.name}</span>
                        <StatusBadge status={
                          patient.nurse_summary_completed ? 'completed' :
                          patient.doctor_notes_completed ? 'pending' : 'inactive'
                        }>
                          {patient.nurse_summary_completed ? 'Completed' :
                           patient.doctor_notes_completed ? 'Ready' : 'Waiting'}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {patient.age} yrs • {patient.symptoms || 'No symptoms'}
                      </p>
                      <div className="w-full">
                        <WorkflowProgress patient={patient} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monitoring Checklist */}
              <div className="healthcare-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Monitoring Tasks</h3>
                  <span className="text-sm text-muted-foreground">
                    {completedTasks}/{checklist.length}
                  </span>
                </div>
                <Progress value={progressPercent} className="mb-4 h-2" />
                <div className="space-y-2">
                  {checklist.map((task) => (
                    <label
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        task.completed ? "bg-success/5" : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <span className={cn(
                        "text-sm",
                        task.completed && "text-muted-foreground line-through"
                      )}>
                        {task.task}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Controlled Workflow Sections */}
              {/* Tests Section */}
              {clinicalNotesExtended?.tests_required && (
                <div className="healthcare-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Diagnostic Tests
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Doctor Ordered
                    </span>
                  </div>
                  {testOrders.length > 0 ? (
                    <div className="space-y-3">
                      {testOrders.map((test) => (
                        <div key={test.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{test.test_name}</h4>
                              <p className="text-xs text-muted-foreground">{test.test_type} • {test.urgency}</p>
                            </div>
                            <select
                              value={test.status}
                              onChange={async (e) => {
                                try {
                                  await updateTestStatus(test.id, { status: e.target.value }, 'nurse');
                                  await loadTestOrders(selectedPatient!.id);
                                  notify.success('Test status updated');
                                } catch (error) {
                                  notify.error('Failed to update test status', 'Unable to update test status.');
                                }
                              }}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="ordered">Ordered</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          {test.scheduled_date && (
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {new Date(test.scheduled_date).toLocaleDateString()}
                            </p>
                          )}
                          {test.results && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Results:</strong> {test.results}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tests ordered yet.</p>
                  )}
                </div>
              )}

              {/* Monitoring Tasks Section */}
              {clinicalNotesExtended?.monitoring_required && (
                <div className="healthcare-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Monitoring Tasks
                    </h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Doctor Authorized
                    </span>
                  </div>
                  {monitoringTasks.length > 0 ? (
                    <div className="space-y-3">
                      {monitoringTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{task.task_name}</h4>
                              <p className="text-xs text-muted-foreground">{task.task_type} • {task.frequency || 'As needed'}</p>
                            </div>
                            <select
                              value={task.status}
                              onChange={async (e) => {
                                try {
                                  await updateMonitoringTask(task.id, { status: e.target.value }, 'nurse');
                                  await loadMonitoringTasks(selectedPatient!.id);
                                  notify.success('Task status updated');
                                } catch (error) {
                                  notify.error('Failed to update task status', 'Unable to update task status.');
                                }
                              }}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          {task.last_check_time && (
                            <p className="text-xs text-muted-foreground">
                              Last checked: {new Date(task.last_check_time).toLocaleString()}
                            </p>
                          )}
                          {task.next_check_time && (
                            <p className="text-xs text-muted-foreground">
                              Next check: {new Date(task.next_check_time).toLocaleString()}
                            </p>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await updateMonitoringTask(task.id, {
                                  last_check_time: new Date().toISOString(),
                                  progress_notes: `Checked at ${new Date().toLocaleString()}`
                                }, 'nurse');
                                await loadMonitoringTasks(selectedPatient!.id);
                                notify.success('Check logged');
                              } catch (error) {
                                notify.error('Failed to log check', 'Unable to log check.');
                              }
                            }}
                            className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Log Check
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No monitoring tasks assigned.</p>
                  )}
                </div>
              )}

              {/* Room Allotment Section */}
              {clinicalNotesExtended?.admission_recommended && (
                <div className="healthcare-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Room Allotment
                    </h3>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Admission Recommended
                    </span>
                  </div>
                  {roomAllotment ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Room Number</label>
                          <input
                            type="text"
                            value={roomAllotment.room_number || ''}
                            onChange={async (e) => {
                              try {
                                await updateRoomAllotment(selectedPatient!.id, { room_number: e.target.value }, 'nurse');
                                await loadRoomAllotment(selectedPatient!.id);
                              } catch (error) {
                                notify.error('Failed to update room', 'Unable to update room.');
                              }
                            }}
                            className="w-full text-sm border rounded px-2 py-1 mt-1"
                            placeholder="Enter room number"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Bed Number</label>
                          <input
                            type="text"
                            value={roomAllotment.bed_number || ''}
                            onChange={async (e) => {
                              try {
                                await updateRoomAllotment(selectedPatient!.id, { bed_number: e.target.value }, 'nurse');
                                await loadRoomAllotment(selectedPatient!.id);
                              } catch (error) {
                                notify.error('Failed to update bed', 'Unable to update bed.');
                              }
                            }}
                            className="w-full text-sm border rounded px-2 py-1 mt-1"
                            placeholder="Enter bed number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Ward Type</label>
                        <select
                          value={roomAllotment.ward_type || ''}
                          onChange={async (e) => {
                            try {
                              await updateRoomAllotment(selectedPatient!.id, { ward_type: e.target.value }, 'nurse');
                              await loadRoomAllotment(selectedPatient!.id);
                            } catch (error) {
                              notify.error('Failed to update ward', 'Unable to update ward.');
                            }
                          }}
                          className="w-full text-sm border rounded px-2 py-1 mt-1"
                        >
                          <option value="">Select ward type</option>
                          <option value="general">General</option>
                          <option value="icu">ICU</option>
                          <option value="emergency">Emergency</option>
                          <option value="maternity">Maternity</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Admission Status</label>
                        <select
                          value={roomAllotment.admission_status}
                          onChange={async (e) => {
                            try {
                              const updates: any = { admission_status: e.target.value };
                              if (e.target.value === 'admitted' && !roomAllotment.admission_date) {
                                updates.admission_date = new Date().toISOString();
                              } else if (e.target.value === 'discharged') {
                                updates.discharge_date = new Date().toISOString();
                              }
                              await updateRoomAllotment(selectedPatient!.id, updates, 'nurse');
                              await loadRoomAllotment(selectedPatient!.id);
                              notify.success('Admission status updated');
                            } catch (error) {
                              notify.error('Failed to update status', 'Unable to update admission status.');
                            }
                          }}
                          className="w-full text-sm border rounded px-2 py-1 mt-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="admitted">Admitted</option>
                          <option value="discharged">Discharged</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Room allotment not configured.</p>
                  )}
                </div>
              )}
            </div>

            {/* Condition Explanation Panel */}
            <div className="lg:col-span-2">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* Patient Header */}
                  <div className="healthcare-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[hsl(262,83%,58%)]/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-[hsl(262,83%,58%)]">
                          {(selectedPatient.name || '').split(' ').map(n => n[0]).join('')}
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
                    <StatusBadge status={
                      selectedPatient.nurse_summary_completed ? 'completed' :
                      selectedPatient.doctor_notes_completed ? 'pending' : 'inactive'
                    }>
                      {selectedPatient.nurse_summary_completed ? 'Care Plan Complete' :
                       selectedPatient.doctor_notes_completed ? 'Ready for Care Plan' : 'Waiting for Doctor'}
                    </StatusBadge>
                  </div>

                  {/* Prescription Display */}
                  {clinicalNotes && clinicalNotes.prescription_json && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Doctor's Prescription
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {clinicalNotes.prescription_json.map((item: any, index: number) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-foreground">{item.name}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    Dosage: {item.dosage} • Days: {item.days} • Total Tablets: {item.total_tablets}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Doctor's Clinical Notes - Only show when doctor notes are completed */}
                  {selectedPatient.doctor_notes_completed && !selectedPatient.nurse_summary_completed && clinicalNotes && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground">Doctor's Assessment</h4>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* Clinical Notes Section */}
                        {clinicalNotes.clinical_notes && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-primary" />
                              Clinical Notes
                            </h5>
                            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                              {clinicalNotes.clinical_notes}
                            </div>
                          </div>
                        )}

                        {/* Diagnosis Section */}
                        {clinicalNotes.diagnosis && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <FileText className="w-4 h-4 text-info" />
                              Diagnosis
                            </h5>
                            <div className="text-sm text-muted-foreground bg-info/5 border border-info/20 p-3 rounded-lg whitespace-pre-wrap">
                              {clinicalNotes.diagnosis}
                            </div>
                          </div>
                        )}

                        {/* Treatment Plan Section */}
                        {clinicalNotes.treatment && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Activity className="w-4 h-4 text-success" />
                              Treatment Plan & Special Instructions
                            </h5>
                            <div className="text-sm text-muted-foreground bg-success/5 border border-success/20 p-3 rounded-lg whitespace-pre-wrap">
                              {clinicalNotes.treatment}
                            </div>
                          </div>
                        )}

                        {/* Show placeholder if no content available */}
                        {!clinicalNotes.clinical_notes && !clinicalNotes.diagnosis && !clinicalNotes.treatment && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg italic">
                            Waiting for doctor's clinical assessment...
                          </div>
                        )}

                        {/* Admission Reason if recommended */}
                        {clinicalNotesExtended?.admission_recommended && clinicalNotesExtended?.admission_reason && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-warning" />
                              Admission Required
                            </h5>
                            <div className="text-sm text-muted-foreground bg-warning/5 border border-warning/20 p-3 rounded-lg">
                              {clinicalNotesExtended.admission_reason}
                            </div>
                          </div>
                        )}

                        {/* Tests Required */}
                        {clinicalNotesExtended?.tests_required && testOrders.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Activity className="w-4 h-4 text-warning" />
                              Tests Ordered by Doctor
                            </h5>
                            <div className="text-sm space-y-2">
                              {testOrders.map((test) => (
                                <div key={test.id} className="bg-warning/5 border border-warning/20 p-2 rounded">
                                  <div className="font-medium text-foreground">{test.test_name}</div>
                                  <div className="text-xs text-muted-foreground">{test.test_type} • {test.urgency}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Guidance - Only show when doctor notes are completed */}
                  {selectedPatient.doctor_notes_completed && !selectedPatient.nurse_summary_completed && (
                    <div className="healthcare-card p-6">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Care Plan Summary
                      </h4>
                      <Textarea
                        value={additionalGuidance}
                        onChange={(e) => setAdditionalGuidance(e.target.value)}
                        placeholder="Add any additional notes or guidance for the patient care plan..."
                        className="min-h-[100px] resize-none mb-4"
                      />
                      <Button
                        onClick={handleSubmitNurseSummary}
                        disabled={isSending}
                        className="gap-2"
                      >
                        {isSending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Care Plan
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Show completion status */}
                  {selectedPatient.nurse_summary_completed && (
                    <div className="healthcare-card p-6 border-2 border-success/30 bg-success/5">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                          <h4 className="font-semibold text-foreground">Care Plan Completed</h4>
                          <p className="text-sm text-muted-foreground">
                            Patient care instructions have been documented and workflow advanced
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patient Comprehension Notes */}
                  <div className="healthcare-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Patient Comprehension Notes</h4>
                    <Textarea
                      placeholder="Document patient's understanding and any concerns raised..."
                      className="min-h-[80px] resize-none"
                      value={comprehensionNotes}
                      onChange={(e) => setComprehensionNotes(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="healthcare-card p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select a Patient
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a patient from the list to view their condition explanation
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {currentView === 'patients' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient List Sidebar */}
            <div className="lg:col-span-1">
              <div className="healthcare-card">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Assigned Patients</h3>
                  <Button variant="ghost" size="sm" onClick={() => { loadPatients(); loadDoctorSentPatients(); }} disabled={loading}>
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  </Button>
                </div>
                <div className="p-2 max-h-[600px] overflow-y-auto">
                  {doctorSentPatients.length === 0 && filteredPatients.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3">No patients assigned yet.</p>
                  )}
                  {doctorSentPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        loadClinicalNotes(patient.id);
                        loadTestOrders(patient.id);
                        loadMonitoringTasks(patient.id);
                        loadRoomAllotment(patient.id);
                        setAiExplanation('');
                        setAiGeneratedList([]);
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all duration-200 mb-2",
                        selectedPatient?.id === patient.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-sm">{patient.name}</span>
                        <StatusBadge status={
                          patient.nurse_summary_completed ? 'completed' :
                          patient.doctor_notes_completed ? 'pending' : 'inactive'
                        }>
                          {patient.nurse_summary_completed ? 'Done' :
                           patient.doctor_notes_completed ? 'Ready' : 'Waiting'}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.age} yrs • {patient.gender} • {patient.symptoms || 'No symptoms'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Detail Panel */}
            <div className="lg:col-span-2">
              {selectedPatient ? (
                <div className="space-y-4">
                  {/* Patient Header */}
                  <div className="healthcare-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[hsl(262,83%,58%)]/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-[hsl(262,83%,58%)]">
                          {(selectedPatient.name || '').split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{selectedPatient.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.contact || 'No contact'}
                        </p>
                        {selectedPatient.symptoms && (
                          <p className="text-sm text-muted-foreground mt-1">Symptoms: {selectedPatient.symptoms}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={
                      selectedPatient.nurse_summary_completed ? 'completed' :
                      selectedPatient.doctor_notes_completed ? 'pending' : 'inactive'
                    }>
                      {selectedPatient.nurse_summary_completed ? 'Care Plan Complete' :
                       selectedPatient.doctor_notes_completed ? 'Ready for Care Plan' : 'Waiting for Doctor'}
                    </StatusBadge>
                  </div>

                  {/* Workflow Progress */}
                  <div className="healthcare-card p-4">
                    <WorkflowProgress patient={selectedPatient} />
                  </div>

                  {/* Doctor's Clinical Notes */}
                  {clinicalNotes && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary" />
                          Doctor's Assessment
                        </h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {clinicalNotes.clinical_notes && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Clinical Notes</p>
                            <div className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{clinicalNotes.clinical_notes}</div>
                          </div>
                        )}
                        {clinicalNotes.diagnosis && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Diagnosis</p>
                            <div className="text-sm bg-info/5 border border-info/20 p-3 rounded-lg whitespace-pre-wrap">{clinicalNotes.diagnosis}</div>
                          </div>
                        )}
                        {clinicalNotes.treatment && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Treatment Plan</p>
                            <div className="text-sm bg-success/5 border border-success/20 p-3 rounded-lg whitespace-pre-wrap">{clinicalNotes.treatment}</div>
                          </div>
                        )}
                        {!clinicalNotes.clinical_notes && !clinicalNotes.diagnosis && !clinicalNotes.treatment && (
                          <p className="text-sm text-muted-foreground italic">No clinical notes available yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription */}
                  {clinicalNotes?.prescription_json && Array.isArray(clinicalNotes.prescription_json) && clinicalNotes.prescription_json.length > 0 && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Prescribed Medicines
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {clinicalNotes.prescription_json.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              Dosage: {item.dosage} • Days: {item.days} • Total: {item.total_tablets}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Orders */}
                  {testOrders.length > 0 && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Activity className="w-4 h-4 text-warning" />
                          Test Orders
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {testOrders.map((test) => (
                          <div key={test.id} className="border rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-sm">{test.test_name}</h5>
                              <p className="text-xs text-muted-foreground">{test.test_type} • {test.urgency} • Status: {test.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monitoring Tasks */}
                  {monitoringTasks.length > 0 && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Heart className="w-4 h-4 text-success" />
                          Monitoring Tasks
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {monitoringTasks.map((task) => (
                          <div key={task.id} className="border rounded-lg p-3">
                            <h5 className="font-medium text-sm">{task.task_name}</h5>
                            <p className="text-xs text-muted-foreground">{task.task_type} • {task.frequency || 'As needed'} • Status: {task.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Room Allotment */}
                  {roomAllotment && (
                    <div className="healthcare-card">
                      <div className="p-4 border-b border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          Room / Admission
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground">Room</span>
                            <p className="font-medium">{roomAllotment.room_number || 'Not assigned'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Bed</span>
                            <p className="font-medium">{roomAllotment.bed_number || 'Not assigned'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Status</span>
                            <p className="font-medium capitalize">{roomAllotment.admission_status || 'Pending'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Care Plan Actions */}
                  {selectedPatient.doctor_notes_completed && !selectedPatient.nurse_summary_completed && (
                    <div className="healthcare-card p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Care Plan Summary
                      </h4>
                      <Textarea
                        value={additionalGuidance}
                        onChange={(e) => setAdditionalGuidance(e.target.value)}
                        placeholder="Add care plan notes..."
                        className="min-h-[80px] resize-none mb-3"
                      />
                      <Button onClick={handleSubmitNurseSummary} disabled={isSending} className="gap-2">
                        {isSending ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Care Plan</>}
                      </Button>
                    </div>
                  )}

                  {selectedPatient.nurse_summary_completed && (
                    <div className="healthcare-card p-4 border-2 border-success/30 bg-success/5">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                          <h4 className="font-semibold text-foreground">Care Plan Completed</h4>
                          <p className="text-sm text-muted-foreground">Workflow advanced to doctor approval</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="healthcare-card p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a Patient</h3>
                  <p className="text-muted-foreground">Choose a patient from the list to view their complete details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === 'explanations' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient selector for explanations view */}
            <div className="lg:col-span-1">
              <div className="healthcare-card">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Select Patient</h3>
                  <Button variant="ghost" size="sm" onClick={() => { loadPatients(); loadDoctorSentPatients(); }} disabled={loading}>
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  </Button>
                </div>
                <div className="p-2 max-h-[500px] overflow-y-auto">
                  {doctorSentPatients.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3">No patients with doctor notes yet.</p>
                  )}
                  {doctorSentPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        loadClinicalNotes(patient.id);
                        setAiExplanation('');
                        setAiGeneratedList([]); // Clear stale list immediately
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all duration-200 mb-2",
                        selectedPatient?.id === patient.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-sm">{patient.name}</span>
                        <StatusBadge status={
                          patient.nurse_summary_completed ? 'completed' :
                          patient.doctor_notes_completed ? 'pending' : 'inactive'
                        }>
                          {patient.nurse_summary_completed ? 'Done' :
                           patient.doctor_notes_completed ? 'Ready' : 'Waiting'}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.age} yrs • {patient.symptoms || 'No symptoms'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation panel */}
            <div className="lg:col-span-2">
              <div className="healthcare-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Patient Condition Explanations</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !selectedPatient}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isGeneratingAI ? (
                        <AIProcessingLoader />
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate AI Explanation
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleSubmitNurseSummary}
                      disabled={isSending || !selectedPatient || !(aiExplanation && aiExplanation.trim())}
                    >
                      {isSending ? 'Sending...' : 'Send to Doctor'}
                    </Button>
                  </div>
                </div>

                {selectedPatient ? (
                  <div className="space-y-6">
                    {/* Selected patient header */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[hsl(262,83%,58%)]/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-[hsl(262,83%,58%)]">
                          {(selectedPatient.name || '').split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{selectedPatient.name}</h4>
                        <p className="text-xs text-muted-foreground">{selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.symptoms || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="healthcare-card p-4">
                      <h4 className="font-semibold text-foreground mb-4">
                        {selectedPatient.name} - Condition Explanation
                      </h4>
                      <div className="space-y-4">
                        {/* AI generated explanations list — filtered per patient */}
                        {aiGeneratedList.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-foreground">Previously Generated Explanations for {selectedPatient.name}</h5>
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                              {aiGeneratedList.map(item => (
                                <div key={item.ai_output_id} className="p-2 border rounded flex items-start justify-between">
                                  <div>
                                    <div className="text-xs text-muted-foreground truncate max-w-xl">{(item.nurse_explanation || '').slice(0, 200)}</div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button className="text-sm text-primary" onClick={() => { setAiExplanation(item.nurse_explanation); notify.success('Loaded AI explanation'); }}>Load</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h5 className="text-sm font-semibold text-foreground">AI Generated Explanation</h5>
                          <Textarea
                            value={aiExplanation}
                            onChange={(e) => setAiExplanation(e.target.value)}
                            placeholder="Click 'Generate AI Explanation' to create patient-specific guidance..."
                            className="min-h-[120px] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a Patient</h3>
                    <p className="text-muted-foreground">Choose a patient from the list to generate or view condition explanations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {selectedPatient ? (
              <>
                <div className="healthcare-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Vital Signs - {selectedPatient.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">98.6°F</div>
                      <div className="text-sm text-muted-foreground">Temperature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">72 bpm</div>
                      <div className="text-sm text-muted-foreground">Heart Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">120/80</div>
                      <div className="text-sm text-muted-foreground">Blood Pressure</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">98%</div>
                      <div className="text-sm text-muted-foreground">SpO2</div>
                    </div>
                  </div>
                </div>

                <div className="healthcare-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Monitoring Tasks
                  </h3>
                  <div className="space-y-3">
                    {checklist.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          task.completed ? "bg-success/5" : "bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <span className={cn(
                          "text-sm",
                          task.completed && "text-muted-foreground line-through"
                        )}>
                          {task.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="healthcare-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Monitoring Notes
                  </h3>
                  <Textarea
                    placeholder="Document vital signs observations, patient status, and any concerns..."
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2 healthcare-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a Patient
                </h3>
                <p className="text-muted-foreground">
                  Choose a patient to view their vital signs and monitoring data
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
