import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield, Heart, PawPrint } from 'lucide-react';

export type ViewRole = 'owner' | 'caregiver' | 'sitter';

const ROLES: { value: ViewRole; label: string; icon: typeof Shield }[] = [
  { value: 'owner', label: 'Owner', icon: Shield },
  { value: 'caregiver', label: 'Caregiver', icon: Heart },
  { value: 'sitter', label: 'Sitter', icon: PawPrint },
];

export function RoleSwitcher({ role, onChange }: { role: ViewRole; onChange: (role: ViewRole) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = ROLES.find((r) => r.value === role)!;
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative inline-block">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Viewing as</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-300"
        >
          <CurrentIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
          {current.label}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  onChange(r.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${
                  role === r.value ? 'bg-forest-50 text-forest-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {r.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
