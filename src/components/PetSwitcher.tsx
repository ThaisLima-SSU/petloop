import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { Pet } from '@/lib/supabase';
import { PetAvatar } from '@/components/PetAvatar';

type PetSwitcherProps = {
  pets: Pet[];
  activePet: Pet | null;
  onPetChange: (petId: string) => void;
  onAddPet?: () => void;
};

export function PetSwitcher({ pets, activePet, onPetChange, onAddPet }: PetSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!activePet) return null;

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-forest-500">
        <PetAvatar avatarKey={activePet.avatar_key} name={activePet.name} species={activePet.species} size={38} />
      </div>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-lg font-bold text-gray-800 focus:border-forest-400 focus:outline-none"
          aria-expanded={open}
        >
          <span>{activePet.name}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => {
                  onPetChange(pet.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                  pet.id === activePet.id ? 'bg-forest-50 text-forest-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <PetAvatar avatarKey={pet.avatar_key} name={pet.name} species={pet.species} size={32} />
                <span>{pet.name}</span>
              </button>
            ))}
            {onAddPet && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    onAddPet();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-forest-500 transition-colors hover:bg-forest-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-forest-300">
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span>Add New Pet</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
