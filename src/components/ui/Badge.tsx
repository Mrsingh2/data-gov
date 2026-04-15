import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('badge', variants[variant], className)}>{children}</span>
  );
}

export function AccessBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN: { label: 'Open', variant: 'success' },
    REGISTERED: { label: 'Registered', variant: 'info' },
    RESTRICTED: { label: 'Restricted', variant: 'danger' },
  };
  const { label, variant } = map[level] || { label: level, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function VisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <Badge variant={visibility === 'PUBLIC' ? 'success' : 'warning'}>
      {visibility === 'PUBLIC' ? 'Public' : 'Private'}
    </Badge>
  );
}
