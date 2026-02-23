import React, { useEffect, useState } from 'react';
import { getDoctorPatients } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function DoctorConsultationsPlaceholder(){
  const sample = [
    { id: 'P-1001', name: 'Asha Rao', age: 34, gender: 'F', datetime: '2026-02-16 10:30', mode: 'Offline', complaint: 'Fever and cough', status: 'Ongoing' },
    { id: 'P-1002', name: 'Ravi Kumar', age: 46, gender: 'M', datetime: '2026-02-16 11:00', mode: 'Online', complaint: 'Chest pain', status: 'Completed' },
    { id: 'P-1003', name: 'Lina Patel', age: 27, gender: 'F', datetime: '2026-02-16 11:30', mode: 'Offline', complaint: 'Headache', status: 'Cancelled' },
  ];

  const statusClass = (s: string) => s === 'Completed' ? 'text-success' : s === 'Ongoing' ? 'text-warning' : 'text-destructive';
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDoctorPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Consultations</h2>
        <Button onClick={load}>Refresh</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Age / Sex</TableHead>
            <TableHead>Doctor Notes</TableHead>
            <TableHead>Nurse Summary</TableHead>
            <TableHead>Pharmacy</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>Admission</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.name} (ID: {p.id})</TableCell>
              <TableCell>{p.age} / {p.gender}</TableCell>
              <TableCell>{p.doctor_notes_completed ? 'Yes' : 'No'}</TableCell>
              <TableCell>{p.nurse_summary_completed ? 'Yes' : 'No'}</TableCell>
              <TableCell>{p.pharmacy_dispensed ? 'Dispensed' : 'Pending'}</TableCell>
              <TableCell>{p.tests_required ? 'Ordered' : 'No'}</TableCell>
              <TableCell>{p.admission_required ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => window.location.href = `/doctor/patients`}>Open</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
