import React from 'react';

export default function PharmacistDispensing() {
  // Placeholder: Table of patients ready for dispensing
  const patients = [
    { id: 1, name: 'Priya Sharma', prescription: 'Ibuprofen, Sumatriptan', status: 'Ready' },
    { id: 2, name: 'Amit Singh', prescription: 'Paracetamol', status: 'Ready' },
    { id: 3, name: 'Sunita Patel', prescription: 'Metformin', status: 'Dispensed' },
  ];
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Dispensing View</h2>
      <table className="min-w-full bg-background border rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Patient</th>
            <th className="px-4 py-2 text-left">Prescription</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">{p.prescription}</td>
              <td className="px-4 py-2">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
