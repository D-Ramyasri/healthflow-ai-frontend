import { toast } from 'sonner';
import { displayISTTime } from './timeUtils';

function mapErrorMessage(err: any, defaultMsg = 'Something went wrong') {
  if (!err) return defaultMsg;
  if (typeof err === 'string') {
    const s = err;
    if (s.includes('Failed to fetch')) return 'Unable to reach server. Check your network.';
    if (s.includes('User not found')) return 'No such user exists.';
    if (s.includes('Invalid credentials')) return 'Invalid credentials.';
    return s;
  }
  if (err.message) {
    const m = err.message;
    if (m.includes('Failed to fetch')) return 'Unable to reach server. Check your network.';
    if (m.includes('User not found')) return 'No such user exists.';
    if (m.includes('Invalid credentials')) return 'Invalid credentials.';
    return m;
  }
  if (err.detail) return err.detail;
  return defaultMsg;
}

// Workflow event notification functions
export const workflowNotify = {
  // Patient registration event
  patientRegistered: (patientName: string) => {
    toast.success(`Patient ${patientName} has been registered successfully`, {
      description: `Registration completed at ${displayISTTime(new Date().toISOString())}`
    });
  },

  // Doctor consultation completed
  doctorConsultationCompleted: (patientName: string) => {
    toast.info(`Consultation completed for ${patientName}`, {
      description: 'Doctor has submitted clinical notes and treatment plan'
    });
  },

  // Tests ordered by doctor
  testsOrdered: (patientName: string, testCount: number) => {
    toast.info(`Tests ordered for ${patientName}`, {
      description: `${testCount} diagnostic test(s) have been scheduled`
    });
  },

  // Nurse summary completed
  nurseSummaryCompleted: (patientName: string) => {
    toast.info(`Nursing summary completed for ${patientName}`, {
      description: 'Patient care plan and monitoring instructions are ready'
    });
  },

  // Doctor approval completed
  doctorApprovalCompleted: (patientName: string) => {
    toast.success(`Treatment approved for ${patientName}`, {
      description: 'Prescription and care plan have been approved by doctor'
    });
  },

  // Medicine dispensed
  medicineDispensed: (patientName: string) => {
    toast.success(`Medicines dispensed for ${patientName}`, {
      description: 'Pharmacy has completed medication dispensing'
    });
  },

  // Admission recommended
  admissionRecommended: (patientName: string, reason: string) => {
    toast.warning(`Admission recommended for ${patientName}`, {
      description: `Reason: ${reason}`
    });
  },

  // Monitoring required
  monitoringRequired: (patientName: string, tasks: string[]) => {
    toast.info(`Monitoring initiated for ${patientName}`, {
      description: `${tasks.length} monitoring task(s) have been scheduled`
    });
  },

  // Workflow state updated
  workflowStateUpdated: (patientName: string, newState: string) => {
    toast.info(`Workflow updated for ${patientName}`, {
      description: `Status: ${newState}`
    });
  }
};

export const notify = {
  success: (msg: string, opts?: Record<string, any>) => toast.success(msg, opts),
  info: (msg: string, opts?: Record<string, any>) => toast(msg, opts),
  error: (err: any, defaultMsg = 'Something went wrong') => {
    const msg = mapErrorMessage(err, defaultMsg);
    toast.error(msg);
  },

  // Workflow-specific notifications
  workflow: workflowNotify
};

export default notify;
