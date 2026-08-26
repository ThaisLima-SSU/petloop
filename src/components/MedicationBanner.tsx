import { Bell, X } from 'lucide-react';
import type { Pet } from '@/lib/supabase';

export type MedicationAlert = {
  key: string;
  pet: Pet;
  time: string;
};

type MedicationBannerProps = {
  alerts: MedicationAlert[];
  onOpen: (alert: MedicationAlert) => void;
  onDismiss: (key: string) => void;
};

export function MedicationBanner({ alerts, onOpen, onDismiss }: MedicationBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 px-5 pb-3" role="status" aria-live="polite">
      {alerts.map((alert) => (
        <div key={alert.key} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Bell className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <button type="button" onClick={() => onOpen(alert)} className="min-w-0 flex-1 text-left">
            <p className="text-sm font-extrabold text-amber-900">Medication due for {alert.pet.name} at {alert.time}</p>
            <p className="mt-0.5 text-xs font-semibold text-amber-700">Tap to open the medication log</p>
          </button>
          <button type="button" onClick={() => onDismiss(alert.key)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-100" aria-label={`Dismiss medication reminder for ${alert.pet.name}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
