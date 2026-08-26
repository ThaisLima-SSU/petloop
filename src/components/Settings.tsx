import { useState } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  Loader2,
  X,
  Shield,
  Heart,
  PawPrint,
  Link,
  Copy,
  Clock,
} from 'lucide-react';
import type { Pet, User, UserRole, Schedule } from '@/lib/supabase';
import { PetAvatar, DOG_AVATARS, CAT_AVATARS } from '@/components/PetAvatar';
import { CareScheduleEditor } from '@/components/CareScheduleEditor';
import { SitterLinkModal } from '@/components/SitterLinkModal';
import { SitterLinksModal } from '@/components/SitterLinksModal';
import { careScheduleFromDb, type CareSchedule } from '@/lib/schedule';

type SettingsProps = {
  pets: Pet[];
  users: User[];
  schedules: Schedule[];
  onEditPet: (
    pet: Pet,
    updates: { name: string; species: string; avatarKey: string; careSchedule: CareSchedule },
  ) => Promise<void>;
  onDeletePet: (petId: string) => Promise<void>;
  onAddMember: (name: string, role: UserRole) => Promise<void>;
  onEditMember: (userId: string, name: string, role: UserRole) => Promise<void>;
  onDeleteMember: (userId: string) => Promise<void>;
  onGenerateSitterLink: (petId: string, expiresAt: string, sitterName: string | null) => Promise<{ token: string; expiresAt: string }>;
};

export function Settings({
  pets,
  users,
  schedules,
  onEditPet,
  onDeletePet,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onGenerateSitterLink,
}: SettingsProps) {
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [sitterPet, setSitterPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [deletingMember, setDeletingMember] = useState<User | null>(null);
  const [viewingLinksFor, setViewingLinksFor] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-forest-700">Settings</h2>

      {/* Manage Pets */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
          Manage Pets
        </h3>
        <ul className="space-y-3">
          {pets.map((pet) => (
            <li
              key={pet.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
            >
              <PetAvatar avatarKey={pet.avatar_key} name={pet.name} species={pet.species} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-800">{pet.name}</p>
                <p className="text-xs text-gray-400">{pet.species}</p>
              </div>
              <button
                type="button"
                onClick={() => setSitterPet(pet)}
                className="flex items-center gap-1 rounded-lg bg-forest-50 px-2.5 py-1.5 text-xs font-bold text-forest-600 hover:bg-forest-100"
              >
                <Link className="h-3.5 w-3.5" strokeWidth={1.75} /> Sitter Link
              </button>
              <button
                type="button"
                onClick={() => setEditingPet(pet)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeletingPet(pet)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Household Members */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Household Members
          </h3>
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1 rounded-lg bg-forest-50 px-3 py-1.5 text-xs font-bold text-forest-600 hover:bg-forest-100"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Add Member
          </button>
        </div>
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-cream-50">
                {user.role === 'Owner' ? (
                  <Shield className="h-5 w-5 text-forest-500" strokeWidth={1.75} />
                ) : user.role === 'Sitter' ? (
                  <PawPrint className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                ) : (
                  <Heart className="h-5 w-5 text-rose-400" strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              {user.role === 'Sitter' && (
                <button
                  type="button"
                  onClick={() => setViewingLinksFor(user)}
                  className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-100"
                >
                  <Link className="h-3.5 w-3.5" strokeWidth={1.75} /> View Links
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditingMember(user)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeletingMember(user)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sitter link modal */}
      {sitterPet && (
        <SitterLinkModal
          pet={sitterPet}
          onGenerate={onGenerateSitterLink}
          onCancel={() => setSitterPet(null)}
        />
      )}

      {/* Edit pet modal */}
      {editingPet && (
        <EditPetModal
          pet={editingPet}
          petSchedules={schedules.filter((s) => s.pet_id === editingPet.id)}
          onSave={async (updates) => {
            await onEditPet(editingPet, updates);
            setEditingPet(null);
          }}
          onCancel={() => setEditingPet(null)}
        />
      )}

      {/* Delete pet confirmation */}
      {deletingPet && (
        <DeletePetModal
          petName={deletingPet.name}
          onConfirm={async () => {
            await onDeletePet(deletingPet.id);
            setDeletingPet(null);
          }}
          onCancel={() => setDeletingPet(null)}
        />
      )}

      {/* Add member modal */}
      {showAddMember && (
        <AddMemberModal
          onSave={async (name, role) => {
            await onAddMember(name, role);
            setShowAddMember(false);
          }}
          onCancel={() => setShowAddMember(false)}
        />
      )}

      {/* Edit member modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onSave={async (name, role) => {
            await onEditMember(editingMember.id, name, role);
            setEditingMember(null);
          }}
          onCancel={() => setEditingMember(null)}
        />
      )}

      {/* View sitter links modal */}
      {viewingLinksFor && (
        <SitterLinksModal
          member={viewingLinksFor}
          pets={pets}
          onCancel={() => setViewingLinksFor(null)}
        />
      )}

      {/* Delete member confirmation */}
      {deletingMember && (
        <DeleteMemberModal
          memberName={deletingMember.name}
          onConfirm={async () => {
            await onDeleteMember(deletingMember.id);
            setDeletingMember(null);
          }}
          onCancel={() => setDeletingMember(null)}
        />
      )}
    </div>
  );
}

function EditPetModal({
  pet,
  petSchedules,
  onSave,
  onCancel,
}: {
  pet: Pet;
  petSchedules: Schedule[];
  onSave: (updates: { name: string; species: string; avatarKey: string; careSchedule: CareSchedule }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState<'Dog' | 'Cat'>(pet.species === 'Cat' ? 'Cat' : 'Dog');
  const [avatarKey, setAvatarKey] = useState(pet.avatar_key ?? 'dog-pointed');
  const [careSchedule, setCareSchedule] = useState<CareSchedule>(careScheduleFromDb(petSchedules));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatars = species === 'Dog' ? [...DOG_AVATARS] : [...CAT_AVATARS];

  function handleSpeciesChange(next: 'Dog' | 'Cat') {
    setSpecies(next);
    setAvatarKey(next === 'Dog' ? DOG_AVATARS[0] : CAT_AVATARS[0]);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), species, avatarKey, careSchedule });
    } catch {
      setError('Could not save changes. Please try again.');
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Edit {pet.name}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Pet Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass + ' font-normal'}
          />
        </label>

        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Type</p>
          <div className="grid grid-cols-2 gap-3">
            {(['Dog', 'Cat'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeciesChange(s)}
                className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  species === s
                    ? 'border-forest-500 bg-forest-50 text-forest-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Choose Avatar
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {avatars.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAvatarKey(key)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                  avatarKey === key
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <PetAvatar avatarKey={key} species={species} size={40} />
              </button>
            ))}
          </div>
        </div>

        {/* Care Schedule */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Care Schedule
          </p>
          <CareScheduleEditor value={careSchedule} onChange={setCareSchedule} />
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DeletePetModal({
  petName,
  onConfirm,
  onCancel,
}: {
  petName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 text-center sm:rounded-3xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 text-rose-500">
          <Trash2 className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-bold text-gray-800">
          Delete {petName} and all logged history?
        </p>
        <p className="mt-1 text-sm text-gray-400">This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({
  onSave,
  onCancel,
}: {
  onSave: (name: string, role: UserRole) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Caregiver');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), role);
    } catch {
      setError('Could not add member. Please try again.');
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Add Member</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan"
            className={fieldClass + ' font-normal'}
          />
        </label>

        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Role</p>
          <div className="grid grid-cols-3 gap-3">
            {(['Owner', 'Caregiver', 'Sitter'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  role === r
                    ? 'border-forest-500 bg-forest-50 text-forest-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {r === 'Owner' ? (
                  <Shield className="h-4 w-4" strokeWidth={1.75} />
                ) : r === 'Sitter' ? (
                  <PawPrint className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Heart className="h-4 w-4" strokeWidth={1.75} />
                )}
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Add Member
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EditMemberModal({
  member,
  onSave,
  onCancel,
}: {
  member: User;
  onSave: (name: string, role: UserRole) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<UserRole>(member.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), role);
    } catch {
      setError('Could not save changes. Please try again.');
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Edit Member</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass + ' font-normal'}
          />
        </label>

        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Role</p>
          <div className="grid grid-cols-3 gap-3">
            {(['Owner', 'Caregiver', 'Sitter'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  role === r
                    ? 'border-forest-500 bg-forest-50 text-forest-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {r === 'Owner' ? (
                  <Shield className="h-4 w-4" strokeWidth={1.75} />
                ) : r === 'Sitter' ? (
                  <PawPrint className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Heart className="h-4 w-4" strokeWidth={1.75} />
                )}
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DeleteMemberModal({
  memberName,
  onConfirm,
  onCancel,
}: {
  memberName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 text-center sm:rounded-3xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 text-rose-500">
          <Trash2 className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-bold text-gray-800">
          Remove {memberName} from this household?
        </p>
        <p className="mt-1 text-sm text-gray-400">This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
