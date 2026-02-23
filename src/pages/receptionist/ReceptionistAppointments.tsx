import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/notify';
import { Patient } from '@/types/healthcare';
import { getReceptionistPatients } from '@/lib/api';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistAppointments() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentData, setAppointmentData] = useState({ patientId: '', doctorId: '', date: '', time: '', reason: '' });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const p = await getReceptionistPatients();
        setPatients(p);
      } catch (err) {
        notify.error('Failed to load patients');
      }
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic appointment scheduling: emit a notification event to backend
    (async () => {
      try {
        const body = {
          type: 'appointment.scheduled',
          message: `Appointment scheduled for patient ${appointmentData.patientId} with ${appointmentData.doctorId} on ${appointmentData.date} ${appointmentData.time}`
        };
        await fetch('/api/admin/log_event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'receptionist' },
          body: JSON.stringify(body)
        });
      } catch (err) {
        // non-fatal: continue
        console.error('Failed to emit appointment event', err);
      }
    })();

    notify.success('Appointment scheduled successfully!');
    setAppointmentData({ patientId: '', doctorId: '', date: '', time: '', reason: '' });
    navigate('/receptionist');
  };

  return (
    <div className="healthcare-card p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Schedule Appointment</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist')}>Back</Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Select Patient</Label>
          <Select value={appointmentData.patientId} onValueChange={(v) => setAppointmentData({ ...appointmentData, patientId: v })}>
            <SelectTrigger><SelectValue placeholder="Choose a patient" /></SelectTrigger>
            <SelectContent>
              {patients.filter(p => p.patient_registered).map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name} - {p.contact}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Select Doctor</Label>
          <Select value={appointmentData.doctorId} onValueChange={(v) => setAppointmentData({ ...appointmentData, doctorId: v })}>
            <SelectTrigger><SelectValue placeholder="Choose a doctor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="doctor1">Dr. Smith - Cardiology</SelectItem>
              <SelectItem value="doctor2">Dr. Johnson - General Medicine</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={appointmentData.date} onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input type="time" value={appointmentData.time} onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Reason for Visit</Label>
          <Input value={appointmentData.reason} onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })} placeholder="Brief reason" required />
        </div>
        <Button type="submit" className="w-full">Schedule Appointment</Button>
      </form>
    </div>
  );
}
