const API_BASE = '/api';

import { PrescriptionItem } from '@/types/healthcare';

export interface PatientCreate {
  name: string;
  age: number;
  gender: string;
  contact: string;
  symptoms: string;
  preferred_language: string;
}

export interface PatientOut {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  contact?: string;
  symptoms?: string;
  preferred_language?: string;

  // Workflow state flags
  patient_registered: boolean;
  doctor_notes_completed: boolean;
  nurse_summary_completed: boolean;
  doctor_approval_completed: boolean;
  medicine_dispensed: boolean;

  // Timestamps
  registered_at?: string;
  doctor_completed_at?: string;
  nurse_completed_at?: string;
  approved_at?: string;
  dispensed_at?: string;
}

export interface UserLogin {
  username_or_email: string;
  password: string;
  role: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UserOut {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export interface ClinicalNotesCreate {
  patient_id: number;
  notes: string;
  diagnosis: string;
  prescription: string;
}

export interface NurseNotesUpdate {
  patient_id: number;
  notes: string;
}

export interface DispenseConfirmation {
  patient_id: number;
  confirmed: boolean;
}

export interface FinalReport {
  patient_id: number;
  report: string;
}

// Helper function to get auth headers
const getAuthHeaders = (role?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (role) {
    headers['X-User-Role'] = role;
  }
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Patient API
export const registerPatient = async (data: PatientCreate, role: string): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/patient/register_patient`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to register patient');
  }
  return response.json();
};

export const getPatients = async (role: string): Promise<PatientOut[]> => {
  const response = await fetch(`${API_BASE}/patient/get_patients`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  return response.json();
};

// Doctor API
export const addClinicalNotes = async (data: ClinicalNotesCreate, role: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/doctor/add_notes`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add notes');
  }
};

export const generateAI = async (patientId: number, role: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/doctor/generate_ai/${patientId}`, {
    method: 'POST',
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to generate AI');
  }
};

export const generateNurseExplanation = async (data: { patient_id: number; clinical_notes_id?: number; clinical_notes?: string }, role: string): Promise<{ ai_output_id: number; nurse_explanation: string }> => {
  const response = await fetch(`${API_BASE}/doctor/generate_nurse_explanation`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to generate nurse explanation');
  }
  return response.json();
};

export const generatePharmacyInstructions = async (data: { patient_id: number; prescription?: any; prescription_json?: any }, role: string): Promise<{ ai_output_id: number; pharmacy_instructions: string }> => {
  const response = await fetch(`${API_BASE}/doctor/generate_pharmacy_instructions`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to generate pharmacy instructions');
  }
  return response.json();
};

export const approveReport = async (patientId: number, role: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/doctor/approve_report/${patientId}`, {
    method: 'POST',
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to approve report');
  }
};

// Nurse API
export const updateNurseNotes = async (data: NurseNotesUpdate, role: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/nurse/update_notes`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update notes');
  }
};

// Pharmacist API
export const confirmDispense = async (data: DispenseConfirmation, role: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/pharmacist/confirm_dispense`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to confirm dispense');
  }
};

// Admin API
export const login = async (data: UserLogin): Promise<UserOut> => {
  console.log('Calling login API with:', data);
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  console.log('Login response status:', response.status);
  if (!response.ok) {
    let errorMessage = 'Login failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If JSON parsing fails, use the text response
      errorMessage = await response.text() || errorMessage;
    }
    console.log('Login error:', errorMessage);
    throw new Error(errorMessage);
  }
  const result = await response.json();
  console.log('Login result:', result);
  return result.user; // Return the user part
};

export const signup = async (data: UserCreate): Promise<UserOut> => {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Signup failed' }));
    throw new Error(errorData.detail || 'Signup failed');
  }
  return response.json();
};

export const resetPassword = async (data: { username_or_email: string; new_password: string }): Promise<any> => {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Password reset failed' }));
    throw new Error(errorData.detail || 'Password reset failed');
  }
  return response.json();
};

export const getLogs = async (role: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/admin/get_logs`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return response.json();
};

// Workflow API functions
export const workflowTransition = async (data: { patient_id: number; action: string }, role: string): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/patient/workflow_transition`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Workflow transition failed' }));
    throw new Error(errorData.detail || 'Workflow transition failed');
  }
  return response.json();
};

export const getClinicalNotes = async (patientId: number, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/clinical_notes/${patientId}`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch clinical notes');
  }
  return response.json();
};

export const getClinicalNotesHistory = async (patientId: number, role: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/doctor/clinical_notes/${patientId}/history`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch clinical notes history');
  }
  return response.json();
};

export const submitDoctorNotes = async (data: { patient_id: number; clinical_notes?: string; diagnosis: string; treatment: string; prescription: PrescriptionItem[]; tests_required?: boolean; tests_ordered?: string[]; admission_recommended?: boolean; admission_reason?: string; monitoring_required?: boolean; monitoring_tasks?: string[] }, role: string): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/doctor/submit_doctor_notes`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Doctor notes submission failed' }));
    throw new Error(errorData.detail || 'Doctor notes submission failed');
  }
  const patient = await response.json();

  // Ensure workflow transition is explicit (best-effort) and notify other clients immediately.
  try {
    // Best-effort: mark workflow as doctor_complete via workflow endpoint
    await workflowTransition({ patient_id: data.patient_id, action: 'doctor_complete' }, role);
  } catch (e) {
    console.warn('workflowTransition failed (non-fatal):', e);
  }

  // Emit a lightweight admin event with meta so backend notifications include patient id
  try {
    await fetch(`${API_BASE}/admin/log_event`, {
      method: 'POST',
      headers: getAuthHeaders(role),
      body: JSON.stringify({ type: 'doctor.notes_complete', message: `Doctor notes completed for patient ${data.patient_id}`, meta: { patient_id: data.patient_id } }),
    });
  } catch (e) {
    console.warn('Failed to emit admin log event for doctor notes:', e);
  }

  // Dispatch a client-side event so any open nurse dashboards refresh immediately
  try {
    window.dispatchEvent(new CustomEvent('workflow:update', { detail: { type: 'doctor.notes_complete', patient_id: data.patient_id } }));
  } catch (e) {
    console.warn('Failed to dispatch workflow:update event', e);
  }

  return patient;
};

export const updateClinicalNotes = async (clinicalNotesId: number, data: { clinical_notes?: string; prescription_json?: any; tests_required?: boolean; tests_ordered?: string[]; admission_recommended?: boolean; admission_reason?: string; monitoring_required?: boolean; monitoring_tasks?: string[] }, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/clinical_notes/${clinicalNotesId}`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Update failed' }));
    throw new Error(errorData.detail || 'Update failed');
  }
  return response.json();
};

export const deleteClinicalNotes = async (clinicalNotesId: number, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/clinical_notes/${clinicalNotesId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(errorData.detail || 'Delete failed');
  }
  return response.json();
};

export const deleteAllClinicalNotes = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/clinical_notes/actions/delete_all`, {
    method: 'POST',
    headers: getAuthHeaders('doctor'),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Delete all failed' }));
    throw new Error(errorData.detail || 'Delete all failed');
  }
  return response.json();
};

export const approveNurseSummary = async (data: { patient_id: number }): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/doctor/approve_nurse_summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Approval failed' }));
    throw new Error(errorData.detail || 'Approval failed');
  }
  return response.json();
};

export const submitNurseSummary = async (data: { patient_id: number; care_instructions: string; additional_notes?: string }): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/nurse/submit_nurse_summary`, {
    method: 'POST',
    headers: getAuthHeaders('nurse'),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Nurse summary submission failed' }));
    throw new Error(errorData.detail || 'Nurse summary submission failed');
  }
  const patient = await response.json();

  // Dispatch a client-side workflow event so other open dashboards refresh immediately
  try {
    window.dispatchEvent(new CustomEvent('workflow:update', { detail: { type: 'nurse.summary_complete', patient_id: data.patient_id } }));
  } catch (e) {
    console.warn('Failed to dispatch workflow:update event for nurse summary', e);
  }

  // Also emit an admin log event to the backend (best-effort) so server-side logs/notifications capture the action.
  try {
    await fetch(`${API_BASE}/admin/log_event`, {
      method: 'POST',
      headers: getAuthHeaders('nurse'),
      body: JSON.stringify({ type: 'nurse.summary_complete', message: `Nurse summary completed for patient ${data.patient_id}`, meta: { patient_id: data.patient_id } }),
    });
  } catch (e) {
    console.warn('Failed to emit admin log event for nurse summary:', e);
  }

  // Broadcast in-page across tabs (same-origin) so other open dashboards update immediately
  try {
    const bc = new BroadcastChannel('healthflow-workflow');
    bc.postMessage({ type: 'nurse.summary_complete', patient_id: data.patient_id });
    bc.close();
  } catch (e) {
    // BroadcastChannel may not be available in all environments; ignore failures
    console.warn('BroadcastChannel unavailable:', e);
  }

  return patient;
};

export const dispenseMedicine = async (data: { patient_id: number; pharmacist_notes?: string }, role: string): Promise<PatientOut> => {
  const response = await fetch(`${API_BASE}/pharmacy/dispense_medicine`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Medicine dispense failed' }));
    throw new Error(errorData.detail || 'Medicine dispense failed');
  }
  return response.json();
};

// Role-specific patient getters
export const getReceptionistPatients = async (): Promise<PatientOut[]> => {
  console.log('🌐 API: Fetching patients from:', `${API_BASE}/patient/patients`);
  const response = await fetch(`${API_BASE}/patient/patients`, {
    headers: getAuthHeaders('receptionist'),
  });
  console.log('🌐 API: Response status:', response.status);
  if (!response.ok) {
    console.error('🌐 API: Response not ok:', response.status, response.statusText);
    throw new Error('Failed to fetch patients');
  }
  const data = await response.json();
  console.log('🌐 API: Received data:', data);
  return data;
};

export const getDoctorPatients = async (): Promise<PatientOut[]> => {
  const response = await fetch(`${API_BASE}/doctor/patients`, {
    headers: getAuthHeaders('doctor'),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  return response.json();
};

export const getNursePatients = async (): Promise<PatientOut[]> => {
  const response = await fetch(`${API_BASE}/nurse/patients`, {
    headers: getAuthHeaders('nurse'),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  return response.json();
};

export const getPharmacistPatients = async (): Promise<PatientOut[]> => {
  const response = await fetch(`${API_BASE}/pharmacy/patients`, {
    headers: getAuthHeaders('pharmacist'),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  return response.json();
};

// Report API
export const generateFinalReport = async (patientId: number, role: string): Promise<FinalReport> => {
  const response = await fetch(`${API_BASE}/report/generate_final_report/${patientId}`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to generate report');
  }
  return response.json();
};

// Controlled Workflow API functions
export const getPatientTests = async (patientId: number, role: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/doctor/tests/${patientId}`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patient tests');
  }
  return response.json();
};

export const updateTestStatus = async (testId: number, data: any, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/tests/${testId}`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update test status');
  }
  return response.json();
};

export const getPatientMonitoringTasks = async (patientId: number, role: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/doctor/monitoring/${patientId}`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch monitoring tasks');
  }
  return response.json();
};

export const updateMonitoringTask = async (taskId: number, data: any, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/monitoring/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update monitoring task');
  }
  return response.json();
};

export const getPatientRoomAllotment = async (patientId: number, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/room-allotment/${patientId}`, {
    headers: getAuthHeaders(role),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch room allotment');
  }
  return response.json();
};

export const updateRoomAllotment = async (patientId: number, data: any, role: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/doctor/room-allotment/${patientId}`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update room allotment');
  }
  return response.json();
};

export const getNotifications = async (role: string, limit: number = 20): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/admin/notifications?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(role),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const getNurseAIExplanations = async (patientId?: number): Promise<any[]> => {
  const url = patientId
    ? `${API_BASE}/nurse/ai_explanations?patient_id=${patientId}`
    : `${API_BASE}/nurse/ai_explanations`;
  const response = await fetch(url, {
    headers: getAuthHeaders('nurse'),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch nurse AI explanations');
  }
  return response.json();
};

export const generateFreshNurseExplanation = async (data: { patient_id: number; clinical_notes_id?: number; clinical_notes?: string }, role: string, userId?: number): Promise<{ prompt: string; response: string; nurse_explanation?: string; ai_history_id?: number }> => {
  const headers = getAuthHeaders(role);
  if (userId) headers['X-User-Id'] = String(userId);
  const response = await fetch(`${API_BASE}/nurse/generate_ai_explanation/${data.patient_id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to generate nurse explanation' }));
    throw new Error(err.detail || 'Failed to generate nurse explanation');
  }
  return response.json();
};

export const getPatientsWithDoctorNotes = async (): Promise<PatientOut[]> => {
  const response = await fetch(`${API_BASE}/nurse/patients/doctor_sent`, {
    headers: getAuthHeaders('nurse'),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients with doctor notes');
  }
  return response.json();
};

export const getAIHealth = async (): Promise<{ status: string; model_loaded: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/nurse/health`, {
    headers: getAuthHeaders('nurse'),
  });
  if (!response.ok) {
    throw new Error('Failed to check AI health');
  }
  return response.json();
};