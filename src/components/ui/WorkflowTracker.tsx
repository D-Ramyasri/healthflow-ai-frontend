import { Check, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowStatus } from '@/types/healthcare';

interface WorkflowTrackerProps {
  status: WorkflowStatus;
  className?: string;
}

const steps = [
  { key: 'diagnosisCompleted', label: 'Doctor Diagnosis' },
  { key: 'nurseExplanationCompleted', label: 'Nurse Explanation' },
  { key: 'pharmacyDispensingCompleted', label: 'Pharmacy Dispensing' },
  { key: 'doctorApprovalCompleted', label: 'Doctor Approval' },
] as const;

export function WorkflowTracker({ status, className }: WorkflowTrackerProps) {
  const getStepStatus = (key: keyof WorkflowStatus, index: number) => {
    if (status[key]) return 'completed';
    
    const previousKey = index > 0 ? steps[index - 1].key : null;
    if (previousKey && status[previousKey]) return 'active';
    if (index === 0 && !status[key]) return 'active';
    
    return 'pending';
  };

  return (
    <div className={cn("healthcare-card p-4", className)}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Workflow Progress</h3>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, index);
          
          return (
            <div
              key={step.key}
              className={cn(
                "workflow-step",
                stepStatus === 'completed' && "workflow-step-completed",
                stepStatus === 'active' && "workflow-step-active",
                stepStatus === 'pending' && "workflow-step-pending"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                stepStatus === 'completed' && "bg-success text-success-foreground",
                stepStatus === 'active' && "bg-primary text-primary-foreground",
                stepStatus === 'pending' && "bg-muted text-muted-foreground"
              )}>
                {stepStatus === 'completed' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : stepStatus === 'active' ? (
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                stepStatus === 'completed' && "text-success",
                stepStatus === 'active' && "text-primary",
                stepStatus === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
