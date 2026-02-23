import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';

export default function DoctorPrescriptionsPlaceholder(){
  const sample = [
    { id: 'P-1001', name: 'Asha Rao', diagnosis: 'Upper respiratory infection', medicines: 'Paracetamol, Azithromycin', dosage: '500mg 3x/day, 250mg 1x/day', instructions: 'After food', date: '2026-02-16', followup: '2026-02-23' },
    { id: 'P-1002', name: 'Ravi Kumar', diagnosis: 'Hypertension', medicines: 'Amlodipine', dosage: '5mg once daily', instructions: 'Morning', date: '2026-02-15', followup: '2026-03-01' },
  ];

  return (
    <div className="healthcare-card p-4">
      <h3 className="font-semibold mb-2">Prescriptions</h3>
      <p className="text-sm text-muted-foreground mb-4">Recent prescriptions issued by you.</p>

      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-sm text-muted-foreground text-left">
              <th className="py-2 pr-4">Patient Name</th>
              <th className="py-2 pr-4">Patient ID</th>
              <th className="py-2 pr-4">Diagnosis</th>
              <th className="py-2 pr-4">Medicines</th>
              <th className="py-2 pr-4">Dosage</th>
              <th className="py-2 pr-4">Instructions</th>
              <th className="py-2 pr-4">Date Issued</th>
              <th className="py-2 pr-4">Follow-up Date</th>
              <th className="py-2 pr-4"> </th>
            </tr>
          </thead>
          <tbody>
            {sample.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-3 pr-4">{s.name}</td>
                <td className="py-3 pr-4">{s.id}</td>
                <td className="py-3 pr-4">{s.diagnosis}</td>
                <td className="py-3 pr-4">{s.medicines}</td>
                <td className="py-3 pr-4">{s.dosage}</td>
                <td className="py-3 pr-4">{s.instructions}</td>
                <td className="py-3 pr-4">{s.date}</td>
                <td className="py-3 pr-4">{s.followup}</td>
                <td className="py-3 pr-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => alert(`Download ${s.id}`)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => alert(`Edit ${s.id}`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
