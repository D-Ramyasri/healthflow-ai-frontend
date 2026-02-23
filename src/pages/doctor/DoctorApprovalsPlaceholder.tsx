import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export default function DoctorApprovalsPlaceholder(){
  const sample = [
    { id: 'P-1004', name: 'Mohit Singh', type: 'Nurse Summary', date: '2026-02-15', desc: 'Request approval for discharge summary' },
    { id: 'P-1005', name: 'Sana Ali', type: 'Medication Change', date: '2026-02-16', desc: 'Increase dose of analgesic' },
  ];

  return (
    <div className="healthcare-card p-4">
      <h3 className="font-semibold mb-2">Pending Approvals</h3>
      <p className="text-sm text-muted-foreground mb-4">Items awaiting your approval.</p>

      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-sm text-muted-foreground text-left">
              <th className="py-2 pr-4">Patient Name</th>
              <th className="py-2 pr-4">Request Type</th>
              <th className="py-2 pr-4">Request Date</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4"> </th>
            </tr>
          </thead>
          <tbody>
            {sample.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-3 pr-4">{s.name}</td>
                <td className="py-3 pr-4">{s.type}</td>
                <td className="py-3 pr-4">{s.date}</td>
                <td className="py-3 pr-4">{s.desc}</td>
                <td className="py-3 pr-4 flex items-center gap-2">
                  <Button className="bg-success text-success-foreground" size="sm" onClick={() => alert(`Approved ${s.id}`)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button className="bg-destructive text-destructive-foreground" size="sm" onClick={() => alert(`Rejected ${s.id}`)}>
                    <X className="w-4 h-4" />
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
