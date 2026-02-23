import React from 'react';

export function ReceptionistConsultations() {
  return (
    <div className="healthcare-card p-6">
      <h3 className="font-semibold text-foreground mb-2">Consultations</h3>
      <p className="text-sm text-muted-foreground">Diagnosis entry, treatment notes, test ordering and monitoring (placeholder).</p>
    </div>
  );
}

export function ReceptionistPrescriptions() {
  return (
    <div className="healthcare-card p-6">
      <h3 className="font-semibold text-foreground mb-2">Prescriptions</h3>
      <p className="text-sm text-muted-foreground">Medicine entry, dosage config and tablet calculations (placeholder).</p>
    </div>
  );
}

export function ReceptionistPendingApprovals() {
  return (
    <div className="healthcare-card p-6">
      <h3 className="font-semibold text-foreground mb-2">Pending Approvals</h3>
      <p className="text-sm text-muted-foreground">Nurse summary approvals and instruction approvals (placeholder).</p>
    </div>
  );
}
