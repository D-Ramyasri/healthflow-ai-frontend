import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, FileText, Users, Clock, CheckCircle, Calendar } from 'lucide-react';
import { WorkflowProgress } from '@/components/ui/WorkflowProgress';
import { Patient } from '@/types/healthcare';

interface Props {
  patients: Patient[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export default function ReceptionistHome(props: Props) {
  const outletCtx = useOutletContext<any>();
  const patients = outletCtx?.patients ?? props.patients;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="healthcare-card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{patients.length}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Patients</p>
        </div>
        <div className="healthcare-card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-2xl font-bold text-foreground">{patients.filter(p => p.patient_registered && !p.doctor_notes_completed).length}</span>
          </div>
          <p className="text-sm text-muted-foreground">Waiting for Doctor</p>
        </div>
        <div className="healthcare-card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-foreground">{patients.filter(p => p.doctor_approval_completed).length}</span>
          </div>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="healthcare-card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-info" />
            <span className="text-2xl font-bold text-foreground">{patients.filter(p => p.patient_registered).length}</span>
          </div>
          <p className="text-sm text-muted-foreground">Registered Today</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="healthcare-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Today's Patients</h3>
            </div>
            <div className="divide-y divide-border">
              {patients.map((patient, index) => (
                <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{patient.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{patient.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{patient.age} yrs • {patient.gender} • {patient.contact}</p>
                        <div className="w-full max-w-md">
                          <WorkflowProgress patient={patient} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
            <div className="healthcare-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <QuickActions />
              </div>
            </div>
          </div>
      </div>
    </>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/receptionist/register')}>
        <UserPlus className="w-4 h-4 text-primary" />
        Register Patient
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/receptionist/records')}>
        <FileText className="w-4 h-4 text-info" />
        Patient Records
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/receptionist/appointments')}>
        <Calendar className="w-4 h-4 text-warning" />
        Appointments
      </Button>
    </div>
  );
}
