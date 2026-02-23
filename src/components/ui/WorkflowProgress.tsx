import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowProgressProps {
  patient: {
    patient_registered: boolean;
    doctor_notes_completed: boolean;
    nurse_summary_completed: boolean;
    doctor_approval_completed: boolean;
    medicine_dispensed: boolean;
  };
  className?: string;
}

const steps = [
  { key: 'patient_registered', label: 'Registered', description: 'Patient registered' },
  { key: 'doctor_notes_completed', label: 'Doctor Notes', description: 'Doctor completed diagnosis' },
  { key: 'nurse_summary_completed', label: 'Nurse Summary', description: 'Nurse added care instructions' },
  { key: 'doctor_approval_completed', label: 'Approved', description: 'Doctor approved summary' },
  { key: 'medicine_dispensed', label: 'Dispensed', description: 'Medicine dispensed' },
];

export function WorkflowProgress({ patient, className }: WorkflowProgressProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">Workflow Progress</h3>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = patient[step.key as keyof typeof patient];
          const isCurrent = index === 0 ? !patient.patient_registered :
                           index === 1 ? patient.patient_registered && !patient.doctor_notes_completed :
                           index === 2 ? patient.doctor_notes_completed && !patient.nurse_summary_completed :
                           index === 3 ? patient.nurse_summary_completed && !patient.doctor_approval_completed :
                           patient.doctor_approval_completed && !patient.medicine_dispensed;

          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : isCurrent ? (
                  <Clock className="w-6 h-6 text-blue-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  isCompleted ? "text-green-700" :
                  isCurrent ? "text-blue-700" : "text-gray-500"
                )}>
                  {step.label}
                </p>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}