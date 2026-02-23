import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { getReceptionistPatients } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Patient } from '@/types/healthcare';
import { displayISTTime } from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await getReceptionistPatients();
      setPatients(data);
      notify.success(`Loaded ${data.length} patients`);
    } catch (err) {
      notify.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filtered = patients.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.contact || '').toLowerCase().includes(q) || (p.symptoms || '').toLowerCase().includes(q);
  });

  return (
    <div className="healthcare-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Patient Records</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadPatients()}>
            <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist')}>Back</Button>
        </div>
      </div>
      <div className="mb-4">
        <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No patients found</div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{p.name}</h4>
                <span className="text-xs text-muted-foreground">{p.registered_at ? displayISTTime(p.registered_at) : '—'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.age} yrs • {p.gender} • {p.contact}</p>
              <p className="text-sm text-muted-foreground mt-1">Symptoms: {p.symptoms}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
