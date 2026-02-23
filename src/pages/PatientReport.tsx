import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  FileText, Download, Volume2, Calendar, CheckCircle,
  Stethoscope, Heart, Pill, Clock, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from '@/components/ui/StatusBadge';

const patientReport = {
  patient: {
    name: 'John Smith',
    age: 45,
    id: 'PT-2024-001'
  },
  doctorSummary: `Patient presents with mild hypertension and early stage cardiovascular concerns. 
Recommended lifestyle modifications along with medication therapy. 
Follow-up in 2 weeks to assess treatment response.
Blood pressure: 145/92 mmHg
Heart rate: 78 bpm`,
  
  nurseExplanation: {
    condition: "Your heart is working a bit harder than normal to pump blood through your body. This is called high blood pressure, and it's quite common and very manageable with the right care.",
    recovery: "With proper medication and lifestyle changes, most patients see significant improvement within 2-4 weeks. Your body will gradually adjust, and you should start feeling more energetic.",
    lifestyle: [
      "Reduce salt intake to less than 2 grams daily",
      "Walk for 20-30 minutes each day",
      "Get 7-8 hours of quality sleep",
      "Practice stress-reducing activities like deep breathing"
    ],
    warnings: [
      "Severe headache that doesn't go away",
      "Chest pain or discomfort",
      "Difficulty breathing",
      "Vision changes"
    ]
  },
  
  pharmacyInstruction: {
    medications: [
      {
        name: 'Aspirin 81mg',
        schedule: 'Once daily with breakfast',
        duration: '30 days',
        notes: 'Take with food to prevent stomach upset'
      },
      {
        name: 'Metoprolol 25mg',
        schedule: 'Twice daily (morning and evening)',
        duration: '30 days',
        notes: 'May cause initial dizziness, rise slowly from sitting'
      }
    ]
  },
  
  followUp: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
};

export default function PatientReport() {
  const [language, setLanguage] = useState('english');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDownloading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <DashboardLayout title="Patient Instruction Report" subtitle="Final unified communication document">
      {/* Header Card */}
      <div className="healthcare-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{patientReport.patient.name}</h2>
              <p className="text-sm text-muted-foreground">
                {patientReport.patient.age} years • ID: {patientReport.patient.id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-36">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="telugu">Telugu</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Volume2 className="w-4 h-4" />
              Listen
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-6">
        {/* Doctor Summary */}
        <div className="healthcare-card overflow-hidden">
          <div className="p-4 bg-primary/5 border-b border-border flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Doctor's Summary</h3>
            <StatusBadge status="approved">Approved</StatusBadge>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {patientReport.doctorSummary}
            </pre>
          </div>
        </div>

        {/* Nurse Explanation */}
        <div className="healthcare-card overflow-hidden">
          <div className="p-4 bg-[hsl(262,83%,58%)]/5 border-b border-border flex items-center gap-3">
            <Heart className="w-5 h-5 text-[hsl(262,83%,58%)]" />
            <h3 className="font-semibold text-foreground">Condition Explanation</h3>
            <StatusBadge status="approved">Approved</StatusBadge>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Understanding Your Condition</h4>
              <p className="text-sm text-muted-foreground">{patientReport.nurseExplanation.condition}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Recovery Expectations</h4>
              <p className="text-sm text-muted-foreground">{patientReport.nurseExplanation.recovery}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Lifestyle Recommendations</h4>
              <ul className="space-y-2">
                {patientReport.nurseExplanation.lifestyle.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                ⚠️ Warning Signs to Watch
              </h4>
              <ul className="space-y-1">
                {patientReport.nurseExplanation.warnings.map((item, i) => (
                  <li key={i} className="text-sm text-warning">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pharmacy Instructions */}
        <div className="healthcare-card overflow-hidden">
          <div className="p-4 bg-warning/5 border-b border-border flex items-center gap-3">
            <Pill className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Medication Instructions</h3>
            <StatusBadge status="approved">Dispensed</StatusBadge>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {patientReport.pharmacyInstruction.medications.map((med, i) => (
                <div key={i} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-foreground">{med.name}</h5>
                    <span className="text-xs text-muted-foreground">{med.duration}</span>
                  </div>
                  <p className="text-sm text-primary font-medium mb-1">{med.schedule}</p>
                  <p className="text-sm text-muted-foreground">{med.notes}</p>
                </div>
              ))}
            </div>

            {/* Visual Medication Timeline */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-4">Daily Medication Schedule</h4>
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                {['6 AM', '12 PM', '6 PM', '10 PM'].map((time, i) => (
                  <div key={time} className="text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto",
                      (i === 0 || i === 2) ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Pill className={cn(
                        "w-5 h-5",
                        (i === 0 || i === 2) ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="text-xs text-muted-foreground">{time}</span>
                    {(i === 0 || i === 2) && (
                      <p className="text-xs font-medium text-primary mt-1">Take meds</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up Reminder */}
        <div className="healthcare-card p-6 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Follow-up Appointment</h4>
              <p className="text-sm text-muted-foreground">
                Your next appointment is scheduled for{' '}
                <span className="font-semibold text-primary">
                  {patientReport.followUp.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
            <Button variant="outline">Add to Calendar</Button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm fade-in">
          <div className="healthcare-card-elevated p-8 scale-in text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Download Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your patient instruction report has been downloaded successfully
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
