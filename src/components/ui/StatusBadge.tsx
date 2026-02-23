import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'safe' | 'caution' | 'risk' | 'pending' | 'approved' | 'completed' | 'inactive';
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusStyles = {
    safe: 'status-safe',
    caution: 'status-caution',
    risk: 'status-risk',
    pending: 'bg-warning/10 text-warning border border-warning/20',
    approved: 'bg-success/10 text-success border border-success/20',
    completed: 'bg-primary/10 text-primary border border-primary/20',
    inactive: 'bg-muted text-muted-foreground border border-border',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      statusStyles[status],
      className
    )}>
      {children}
    </span>
  );
}
