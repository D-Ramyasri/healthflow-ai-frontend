import { Shield, Lock } from 'lucide-react';

export function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
      <Shield className="w-3.5 h-3.5" />
      <span>AI Processing: Local & Secure</span>
      <Lock className="w-3 h-3" />
    </div>
  );
}
