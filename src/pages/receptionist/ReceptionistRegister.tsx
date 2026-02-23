import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/notify';
import { registerPatient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', age: '', gender: '', contact: '', symptoms: '', preferred_language: 'english' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.symptoms.trim()) {
      notify.error('Please fill in all required fields (Name, Contact, Symptoms)');
      return;
    }
    const age = parseInt(formData.age);
    if (isNaN(age) || age <= 0 || age > 150) {
      notify.error('Please enter a valid age');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerPatient({ name: formData.name.trim(), age, gender: formData.gender || undefined, contact: formData.contact.trim(), symptoms: formData.symptoms.trim(), preferred_language: formData.preferred_language }, 'receptionist');
      notify.success('Patient registered successfully!');
      navigate('/receptionist');
    } catch (err: any) {
      notify.error(err?.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="healthcare-card p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">New Patient</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist')}>Cancel</Button>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter patient name" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Age</Label>
            <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" required />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Contact Number</Label>
          <Input type="tel" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="+1 (555) 000-0000" required />
        </div>
        <div className="space-y-2">
          <Label>Preferred Language</Label>
          <Select value={formData.preferred_language} onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="telugu">Telugu</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Symptoms</Label>
          <Input placeholder="Brief description of symptoms" value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Registering...' : 'Submit'}</Button>
          <Button type="reset" variant="outline">Reset</Button>
        </div>
      </form>
    </div>
  );
}
