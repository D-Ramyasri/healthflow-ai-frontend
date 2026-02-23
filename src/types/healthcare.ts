export type UserRole = 'receptionist' | 'doctor' | 'nurse' | 'pharmacist' | 'admin';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name?: string;
  rollnumber?: string;
  phone?: string;
  email?: string;
}

export interface Patient {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  contact?: string;
  phone?: string;
  symptoms?: string;
  preferred_language?: string;
  clinical_notes?: string;

  // Workflow state flags
  patient_registered: boolean;
  doctor_notes_completed: boolean;
  nurse_summary_completed: boolean;
  doctor_approval_completed: boolean;
  medicine_dispensed: boolean;
  tests_required?: boolean;
  test_completed?: boolean;
  monitoring_required?: boolean;
  admission_required?: boolean;
  pharmacy_instructions_completed?: boolean;
  final_report_generated?: boolean;

  // Timestamps
  registered_at?: string;
  doctor_completed_at?: string;
  nurse_completed_at?: string;
  approved_at?: string;
  dispensed_at?: string;
}

export interface WorkflowTransition {
  patient_id: number;
  action: 'register' | 'doctor_complete' | 'nurse_complete' | 'approve' | 'dispense';
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  days: number;
  total_tablets: number;
}

export interface DoctorNotesUpdate {
  patient_id: number;
  diagnosis: string;
  treatment: string;
  prescription: PrescriptionItem[];
}

export interface NurseSummaryUpdate {
  patient_id: number;
  care_instructions: string;
  additional_notes?: string;
}

export interface PharmacyDispense {
  patient_id: number;
  pharmacist_notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicines: Medicine[];
  clinicalNotes: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'dispensed';
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  precautions: string;
  schedule: string;
  foodRestrictions: string;
  sideEffects: string;
}

export interface NurseExplanation {
  id: string;
  prescriptionId: string;
  diseaseExplanation: string;
  bodyCondition: string;
  recoveryExpectations: string;
  lifestyleGuidance: string;
  warningSymptoms: string[];
  additionalGuidance: string;
  status: 'draft' | 'pending_approval' | 'approved';
  approvedBy?: string;
}

export interface PharmacyInstruction {
  id: string;
  prescriptionId: string;
  medications: MedicationInstruction[];
  safetyAlerts: SafetyAlert[];
  status: 'pending' | 'approved' | 'dispensed';
  dispensedAt?: Date;
  dispensedBy?: string;
}

export interface MedicationInstruction {
  medicineId: string;
  medicineName: string;
  dosageSchedule: string;
  foodRestrictions: string;
  duration: string;
  sideEffects: string;
  safetyWarnings: string;
}

export interface SafetyAlert {
  type: 'allergy' | 'interaction' | 'contraindication';
  severity: 'low' | 'medium' | 'high';
  message: string;
  medicineId: string;
}

export interface WorkflowStatus {
  diagnosisCompleted: boolean;
  nurseExplanationCompleted: boolean;
  pharmacyDispensingCompleted: boolean;
  doctorApprovalCompleted: boolean;
}

export interface PatientReport {
  id: string;
  patientId: string;
  prescriptionId: string;
  doctorSummary: string;
  nurseExplanation: NurseExplanation;
  pharmacyInstruction: PharmacyInstruction;
  followUpDate?: Date;
  status: 'draft' | 'approved' | 'delivered';
}

// Controlled Workflow Section Types
export interface TestOrder {
  id: number;
  patient_id: number;
  test_name: string;
  test_type: string;
  urgency: string;
  ordered_by_doctor: boolean;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  results?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface MonitoringTask {
  id: number;
  patient_id: number;
  task_name: string;
  task_type: string;
  frequency?: string;
  duration_hours?: number;
  authorized_by_doctor: boolean;
  status: string;
  progress_notes?: string;
  last_check_time?: string;
  next_check_time?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface RoomAllotment {
  id: number;
  patient_id: number;
  admission_recommended: boolean;
  admission_approved: boolean;
  room_number?: string;
  bed_number?: string;
  ward_type?: string;
  admission_status: string;
  admission_date?: string;
  expected_discharge_date?: string;
  discharge_date?: string;
  admission_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClinicalNotesExtended {
  id: number;
  patient_id: number;
  clinical_notes: string;
  prescription_json: any;
  doctor_approved: boolean;
  tests_required: boolean;
  monitoring_required: boolean;
  admission_recommended: boolean;
  test_recommendations?: any[];
  monitoring_instructions?: any[];
  admission_reason?: string;
}
