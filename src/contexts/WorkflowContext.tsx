import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for workflow data
export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  contact: string;
  symptoms: string;
  preferred_language: string;

  // Workflow state flags
  patient_registered: boolean;
  doctor_notes_completed: boolean;
  nurse_summary_completed: boolean;
  doctor_approval_completed: boolean;
  medicine_dispensed: boolean;

  // Timestamps
  registered_at: string;
  doctor_completed_at?: string;
  nurse_completed_at?: string;
  approved_at?: string;
  dispensed_at?: string;

  // Additional workflow data
  clinical_notes?: any;
  ai_outputs?: any;
  test_orders?: any[];
  monitoring_tasks?: any[];
  room_allotment?: any;
}

interface WorkflowContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshPatients: () => Promise<void>;
  updatePatient: (patientId: number, updates: Partial<Patient>) => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;

  // Workflow state helpers
  getPatientsByWorkflowState: (state: keyof Patient, value: boolean) => Patient[];
  getPatientStats: () => {
    total: number;
    registered: number;
    awaitingDoctor: number;
    doctorCompleted: number;
    nurseCompleted: number;
    approved: number;
    dispensed: number;
  };
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

interface WorkflowProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patients from all roles' perspectives
  const refreshPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get patients from different endpoints based on user role
      // This ensures we get the most up-to-date data
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');

      let endpoint = '/api/patient/patients';
      if (userRole === 'doctor') endpoint = '/api/doctor/patients';
      if (userRole === 'nurse') endpoint = '/api/nurse/patients';
      if (userRole === 'pharmacist') endpoint = '/api/pharmacist/patients';
      if (userRole === 'receptionist') endpoint = '/api/receptionist/patients';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || data || []);
      } else {
        // Fallback to admin endpoint if role-specific fails
        const adminResponse = await fetch('/api/admin/patients_summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          // This might be summary data, so we need to fetch full patient list
          setPatients([]); // Clear until we get full data
        }
      }
    } catch (err) {
      setError('Failed to load patient data');
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update a specific patient
  const updatePatient = async (patientId: number, updates: Partial<Patient>) => {
    try {
      // Optimistically update local state
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, ...updates } : p
      ));

      // Send update to server
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/patient/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        await refreshPatients();
        throw new Error('Failed to update patient');
      }

      // Refresh to get latest data
      await refreshPatients();
    } catch (err) {
      console.error('Error updating patient:', err);
      throw err;
    }
  };

  // Add a new patient
  const addPatient = async (patient: Omit<Patient, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/patient/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patient)
      });

      if (response.ok) {
        await refreshPatients(); // Refresh to get the new patient
      } else {
        throw new Error('Failed to add patient');
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      throw err;
    }
  };

  // Helper functions
  const getPatientsByWorkflowState = (state: keyof Patient, value: boolean) => {
    return patients.filter(p => p[state] === value);
  };

  const getPatientStats = () => {
    return {
      total: patients.length,
      registered: patients.filter(p => p.patient_registered).length,
      awaitingDoctor: patients.filter(p => p.patient_registered && !p.doctor_notes_completed).length,
      doctorCompleted: patients.filter(p => p.doctor_notes_completed).length,
      nurseCompleted: patients.filter(p => p.nurse_summary_completed).length,
      approved: patients.filter(p => p.doctor_approval_completed).length,
      dispensed: patients.filter(p => p.medicine_dispensed).length
    };
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPatients();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    refreshPatients();
  }, []);

  const value: WorkflowContextType = {
    patients,
    loading,
    error,
    refreshPatients,
    updatePatient,
    addPatient,
    getPatientsByWorkflowState,
    getPatientStats
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}