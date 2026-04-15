import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
        sizes[size],
        className,
      )}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Spinner size="lg" />
    </div>
  );
}
