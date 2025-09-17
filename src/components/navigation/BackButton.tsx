import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  label?: string;
}

export function BackButton({ className, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`text-white/60 hover:text-white transition-colors flex items-center gap-2 ${className || ''}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}






















