import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/language';
import type { PageId } from './AppShell';

interface BackButtonProps {
  onNavigate?: (id: PageId) => void;
  onClick?: () => void;
  target?: PageId;
  label?: string;
}

export function BackButton({ onNavigate, onClick, target = 'landing', label }: BackButtonProps) {
  const { t } = useLanguage();
  const labelText = label ?? t('ย้อนกลับ', 'Back');

  return (
    <button
      type="button"
      className="back-button"
      onClick={onClick ?? (() => onNavigate?.(target))}
      aria-label={labelText}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{labelText}</span>
    </button>
  );
}
