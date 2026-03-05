interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}
