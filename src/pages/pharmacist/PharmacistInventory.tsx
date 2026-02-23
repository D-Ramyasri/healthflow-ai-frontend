import React from 'react';

export default function PharmacistInventory() {
  // Placeholder: Table of medicines and stock
  const inventory = [
    { id: 1, name: 'Ibuprofen 400mg', stock: 120 },
    { id: 2, name: 'Sumatriptan 50mg', stock: 40 },
    { id: 3, name: 'Paracetamol 500mg', stock: 200 },
    { id: 4, name: 'Metformin 500mg', stock: 75 },
  ];
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Inventory View</h2>
      <table className="min-w-full bg-background border rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Medicine</th>
            <th className="px-4 py-2 text-left">Stock</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((med) => (
            <tr key={med.id} className="border-t">
              <td className="px-4 py-2">{med.name}</td>
              <td className="px-4 py-2">{med.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
