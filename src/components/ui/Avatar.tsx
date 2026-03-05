interface AvatarProps {
  name?: string;
  isAI?: boolean;
  className?: string;
}

export default function Avatar({ name, isAI, className = '' }: AvatarProps) {
  if (isAI) {
    return (
      <div className={`w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold ${className}`}>
        R
      </div>
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  return (
    <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-bold ${className}`}>
      {initial}
    </div>
  );
}
