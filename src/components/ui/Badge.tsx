interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white/70',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
