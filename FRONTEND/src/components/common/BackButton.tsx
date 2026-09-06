import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  targetScreen?: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ targetScreen = 'dashboard', label = 'Back' }) => {
  const { setActiveScreen } = useApp();

  return (
    <button
      onClick={() => setActiveScreen(targetScreen)}
      className="flex items-center gap-2 text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6] hover:underline"
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </button>
  );
};
