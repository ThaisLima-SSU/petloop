import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, PlusCircle, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { supabase, type Pet, type User, type LogWithUser, type ActivityType, type Schedule, type UserRole } from '@/lib/supabase';
import { Dashboard } from '@/components/Dashboard';
import { QuickLog } from '@/components/QuickLog';
import { History } from '@/components/History';
import { AddPet } from '@/components/AddPet';
import { Settings } from '@/components/Settings';
import { SitterView } from '@/components/SitterView';
import { RoleSwitcher, type ViewRole } from '@/components/RoleSwitcher';
import { MedicationBanner, type MedicationAlert } from '@/components/MedicationBanner';
import { careScheduleFromDb, getScheduledTypesForToday, type CareSchedule, ALL_ACTIVITY_TYPES } from '@/lib/schedule';
import type { EmergencyInfoUpdates } from '@/components/EmergencyInfoEditor';

type Tab = 'dashboard' | 'log' | 'history' | 'settings';

const sitterToken = new URLSearchParams(window.location.search).get('sitter');

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function weekdaysToString(weekdays: boolean[]): string | null {
  const hasFalse = weekdays.some((d) => !d);
  if (!hasFalse) return null;
  return weekdays.map((d) => (d ? '1' : '0')).join(',');
}

async function savePetSchedules(petId: string, careSchedule: CareSchedule) {
  const { data: existing } = await supabase
    .from('schedules')
    .select('id, type')
    .eq('pet_id', petId);

  const existingByType = new Map<string, string[]>();
  for (const row of existing ?? []) {
    const ids = existingByType.get(row.type) ?? [];
    ids.push(row.id);
    existingByType.set(row.type, ids);
  }

  for (const type of ALL_ACTIVITY_TYPES) {
    const config = careSchedule[type];
    const existingIds = existingByType.get(type) ?? [];

    if (!config.enabled) {
      const weekdaysStr = config.frequency === 'specific-days'
        ? weekdaysToString(config.weekdays)
        : null;
      const payload = {
        pet_id: petId,
        type,
        active: false,
        frequency: config.frequency === 'specific-days' ? 'specific-days' : 'daily',
        weekdays: weekdaysStr,
        time_of_day: config.timeOfDay,
        note: config.note,
        visible_to_sitter: config.visibleToSitter,
      };
      if (existingIds.length > 0) {
        await supabase.from('schedules').update(payload).eq('id', existingIds[0]);
        for (let i = 1; i < existingIds.length; i++) {
          await supabase.from('schedules').delete().eq('id', existingIds[i]);
        }
      } else {
        await supabase.from('schedules').insert(payload);
      }
      continue;
    }

    if (config.frequency === 'specific-hours' && config.times.length > 0) {
      const times = config.times.slice(0, 4);
      for (let i = 0; i < times.length; i++) {
        const payload = {
          pet_id: petId,
          type,
          active: true,
          frequency: 'daily',
          weekdays: null,
          time_of_day: times[i],
          note: config.note,
          visible_to_sitter: config.visibleToSitter,
        };
        if (i < existingIds.length) {
          await supabase.from('schedules').update(payload).eq('id', existingIds[i]);
        } else {
          await supabase.from('schedules').insert(payload);
        }
      }
      for (let i = times.length; i < existingIds.length; i++) {
        await supabase.from('schedules').delete().eq('id', existingIds[i]);
      }
    } else {
      const weekdaysStr = config.frequency === 'specific-days'
        ? weekdaysToString(config.weekdays)
        : null;
      const payload = {
        pet_id: petId,
        type,
        active: true,
        frequency: config.frequency === 'specific-days' ? 'specific-days' : 'daily',
        weekdays: weekdaysStr,
        time_of_day: config.timeOfDay,
        note: config.note,
        visible_to_sitter: config.visibleToSitter,
      };
      if (existingIds.length > 0) {
        await supabase.from('schedules').update(payload).eq('id', existingIds[0]);
        for (let i = 1; i < existingIds.length; i++) {
          await supabase.from('schedules').delete().eq('id', existingIds[i]);
        }
      } else {
        await supabase.from('schedules').insert(payload);
      }
    }
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<LogWithUser[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [sitterPet, setSitterPet] = useState<Pet | null>(null);
  const [sitterSchedules, setSitterSchedules] = useState<Schedule[]>([]);
  const [sitterExpiresAt, setSitterExpiresAt] = useState<string | null>(null);
  const [sitterUserId, setSitterUserId] = useState('');
  const [sitterName, setSitterName] = useState('Sitter');
  const [sitterExpired, setSitterExpired] = useState(false);
  const [sitterUnavailable, setSitterUnavailable] = useState(false);
  const [viewRole, setViewRole] = useState<ViewRole>('owner');
  const [sitterPreview, setSitterPreview] = useState<{ token: string; expiresAt: string; sitterName: string; userId: string } | null>(null);
  const [sitterPreviewLoading, setSitterPreviewLoading] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [dismissedMedicationAlerts, setDismissedMedicationAlerts] = useState<Set<string>>(new Set());
  const [logActivityType, setLogActivityType] = useState<ActivityType | null>(null);
  const [logSelectionKey, setLogSelectionKey] = useState(0);

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0] ?? null;

  const loadLogs = useCallback(async (petId: string) => {
    const { start, end } = todayBounds();
    const { data, error } = await supabase
      .from('logs')
      .select('id, pet_id, user_id, type, note, created_at, users(name)')
      .eq('pet_id', petId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setLogs(data as unknown as LogWithUser[]);
    }
  }, []);

  const loadMedicationLogs = useCallback(async (petIds: string[]) => {
    if (petIds.length === 0) {
      setMedicationLogs([]);
      return;
    }
    const { start, end } = todayBounds();
    const { data, error } = await supabase
      .from('logs')
      .select('id, pet_id, user_id, type, note, created_at, users(name)')
      .in('pet_id', petIds)
      .eq('type', 'meds')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });
    if (!error && data) setMedicationLogs(data as unknown as LogWithUser[]);
  }, []);

  const loadPets = useCallback(async () => {
    const { data } = await supabase.from('pets').select('*').order('created_at');
    if (data) setPets(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('users').select('*').order('created_at');
    if (data) setUsers(data);
  }, []);

  const loadSchedules = useCallback(async () => {
    const { data } = await supabase.from('schedules').select('*').order('created_at');
    if (data) setSchedules(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBase() {
      setLoading(true);
      if (sitterToken) {
        const { data: accessRows } = await supabase.rpc('get_sitter_access', { p_token: sitterToken });
        const access = accessRows?.[0] as { pet_id: string; expires_at: string; sitter_name: string | null; sitter_user_id: string | null } | undefined;
        if (!access) {
          setSitterUnavailable(true);
          setLoading(false);
          return;
        }
        setSitterExpiresAt(access.expires_at);
        if (new Date(access.expires_at).getTime() <= Date.now()) {
          setSitterExpired(true);
          setLoading(false);
          return;
        }
        const { start, end } = todayBounds();
        const [petRes, schedulesRes, identityRes, logsRes] = await Promise.all([
          supabase.from('pets').select('*').eq('id', access.pet_id).maybeSingle(),
          supabase.from('schedules').select('*').eq('pet_id', access.pet_id).order('created_at'),
          supabase.rpc('get_sitter_identity', { p_token: sitterToken }),
          supabase.from('logs').select('id, pet_id, user_id, type, note, created_at, users(name)').eq('pet_id', access.pet_id).gte('created_at', start).lt('created_at', end).order('created_at', { ascending: false }),
        ]);
        if (petRes.data) setSitterPet(petRes.data as Pet);
        setSitterSchedules((schedulesRes.data ?? []) as Schedule[]);
        setLogs((logsRes.data ?? []) as unknown as LogWithUser[]);
        const identity = identityRes.data?.[0] as { sitter_name: string | null; sitter_user_id: string | null } | undefined;
        setSitterName(identity?.sitter_name ?? access.sitter_name ?? 'Sitter');
        setSitterUserId(identity?.sitter_user_id ?? access.sitter_user_id ?? '');
        if (!petRes.data || !identity?.sitter_user_id) setSitterUnavailable(true);
        setLoading(false);
        return;
      }
      const [petsRes, usersRes, schedulesRes] = await Promise.all([
        supabase.from('pets').select('*').order('created_at'),
        supabase.from('users').select('*').order('created_at'),
        supabase.from('schedules').select('*').order('created_at'),
      ]);
      if (cancelled) return;
      const loadedPets = petsRes.data ?? [];
      setPets(loadedPets);
      setUsers(usersRes.data ?? []);
      setSchedules(schedulesRes.data ?? []);
      if (loadedPets[0]) {
        setActivePetId(loadedPets[0].id);
        await Promise.all([
          loadLogs(loadedPets[0].id),
          loadMedicationLogs(loadedPets.map((pet) => pet.id)),
        ]);
      }
      if (!cancelled) setLoading(false);
    }
    loadBase();
    return () => {
      cancelled = true;
    };
  }, [loadLogs, loadMedicationLogs]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const medicationAlerts = useMemo<MedicationAlert[]>(() => {
    const now = new Date(clock);
    const alerts: MedicationAlert[] = [];
    for (const schedule of schedules) {
      if (schedule.type !== 'meds' || !schedule.active || !schedule.time_of_day) continue;
      const pet = pets.find((item) => item.id === schedule.pet_id);
      if (!pet) continue;
      const careSchedule = careScheduleFromDb([schedule]);
      if (!getScheduledTypesForToday(careSchedule, now).includes('meds')) continue;
      const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
      const scheduledAt = new Date(now);
      scheduledAt.setHours(hours, minutes, 0, 0);
      const difference = scheduledAt.getTime() - now.getTime();
      if (difference < -15 * 60_000 || difference > 15 * 60_000) continue;
      const key = `${pet.id}:${localDateKey(now)}:${schedule.time_of_day}`;
      if (dismissedMedicationAlerts.has(key)) continue;
      const loggedForOccurrence = medicationLogs.some((log) => {
        if (log.pet_id !== pet.id || localDateKey(new Date(log.created_at)) !== localDateKey(now)) return false;
        const loggedAt = new Date(log.created_at).getTime();
        return loggedAt >= scheduledAt.getTime() - 15 * 60_000 && loggedAt <= now.getTime();
      });
      if (loggedForOccurrence) continue;
      alerts.push({
        key,
        pet,
        time: new Date(`2000-01-01T${schedule.time_of_day}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
    }
    return alerts;
  }, [clock, dismissedMedicationAlerts, medicationLogs, pets, schedules]);

  useEffect(() => {
    if (viewRole !== 'owner' && tab === 'settings') setTab('dashboard');
    if (viewRole === 'sitter') setTab('dashboard');
  }, [viewRole, tab]);

  useEffect(() => {
    if (viewRole !== 'sitter' || !activePet) {
      setSitterPreview(null);
      return;
    }
    let cancelled = false;
    async function loadPreview() {
      setSitterPreviewLoading(true);
      const { data } = await supabase.rpc('get_latest_sitter_token', { p_pet_id: activePet!.id });
      if (cancelled) return;
      const tokenData = data?.[0] as { token: string; expires_at: string; sitter_name: string | null; sitter_user_id: string | null } | undefined;
      if (!tokenData) {
        setSitterPreview(null);
        setSitterPreviewLoading(false);
        return;
      }
      const { data: identityRows } = await supabase.rpc('get_sitter_identity', { p_token: tokenData.token });
      const identity = identityRows?.[0] as { sitter_name: string | null; sitter_user_id: string | null } | undefined;
      if (!identity?.sitter_user_id) {
        setSitterPreview(null);
        setSitterPreviewLoading(false);
        return;
      }
      setSitterPreview({ token: tokenData.token, expiresAt: tokenData.expires_at, sitterName: identity.sitter_name ?? 'Sitter', userId: identity.sitter_user_id });
      setSitterPreviewLoading(false);
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [viewRole, activePet]);

  const handlePetChange = useCallback(
    (petId: string) => {
      setActivePetId(petId);
      loadLogs(petId);
    },
    [loadLogs],
  );

  const handleSave = useCallback(
    async (entry: {
      petId: string;
      userId: string;
      type: ActivityType;
      note: string;
      createdAt: string;
    }) => {
      const { error } = await supabase.from('logs').insert({
        pet_id: entry.petId,
        user_id: entry.userId,
        type: entry.type,
        note: entry.note || null,
        created_at: entry.createdAt,
      });
      if (error) throw error;
      await loadMedicationLogs(pets.map((pet) => pet.id));
      if (activePet) await loadLogs(activePet.id);
    },
    [activePet, loadLogs, loadMedicationLogs, pets],
  );

  const handleAddPet = useCallback(
    async (pet: {
      name: string;
      species: string;
      avatarKey: string;
      careSchedule: CareSchedule;
    }) => {
      const { data, error } = await supabase
        .from('pets')
        .insert({ name: pet.name, species: pet.species, avatar_key: pet.avatarKey })
        .select()
        .single();
      if (error) throw error;
      await loadPets();
      if (data) {
        await savePetSchedules(data.id, pet.careSchedule);
        await loadSchedules();
        setActivePetId(data.id);
        await loadLogs(data.id);
      }
      setShowAddPet(false);
    },
    [loadPets, loadSchedules, loadLogs],
  );

  const handleEditPet = useCallback(
    async (
      pet: Pet,
      updates: { name: string; species: string; avatarKey: string; careSchedule: CareSchedule },
    ) => {
      const { error } = await supabase
        .from('pets')
        .update({ name: updates.name, species: updates.species, avatar_key: updates.avatarKey })
        .eq('id', pet.id);
      if (error) throw error;
      await savePetSchedules(pet.id, updates.careSchedule);
      await loadPets();
      await loadSchedules();
    },
    [loadPets, loadSchedules],
  );

  const handleDeletePet = useCallback(
    async (petId: string) => {
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;
      await loadPets();
      await loadSchedules();
      if (activePetId === petId) {
        setActivePetId(null);
      }
    },
    [loadPets, loadSchedules, activePetId],
  );

  const handleGenerateSitterLink = useCallback(
    async (petId: string, expiresAt: string, sitterName: string | null) => {
      const { data, error } = await supabase.rpc('create_sitter_access', {
        p_pet_id: petId,
        p_expires_at: expiresAt,
        p_sitter_name: sitterName,
      });
      const created = data?.[0] as { token: string; expires_at: string } | undefined;
      if (error || !created) throw error ?? new Error('Could not create sitter link');
      return { token: created.token, expiresAt: created.expires_at };
    },
    [],
  );

  const handleSaveEmergencyInfo = useCallback(
    async (petId: string, updates: EmergencyInfoUpdates) => {
      const { error } = await supabase
        .from('pets')
        .update({
          vet_name: updates.vet_name || null,
          vet_phone: updates.vet_phone || null,
          vet_address: updates.vet_address || null,
          allergies: updates.allergies || null,
          microchip_number: updates.microchip_number || null,
        })
        .eq('id', petId);
      if (error) throw error;
      await loadPets();
    },
    [loadPets],
  );

  const handleAddMember = useCallback(
    async (name: string, role: UserRole) => {
      const { data, error } = await supabase.from('users').insert({ name, role }).select().single();
      if (error) throw error;
      await loadUsers();
      if (role === 'Sitter' && data) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        for (const pet of pets) {
          await supabase.rpc('create_sitter_access', {
            p_pet_id: pet.id,
            p_expires_at: expiresAt.toISOString(),
            p_sitter_name: name,
            p_sitter_user_id: data.id,
          });
        }
      }
    },
    [loadUsers, pets],
  );

  const handleEditMember = useCallback(
    async (userId: string, name: string, role: UserRole) => {
      const { error } = await supabase.from('users').update({ name, role }).eq('id', userId);
      if (error) throw error;
      await loadUsers();
      if (role === 'Sitter') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        for (const pet of pets) {
          await supabase.rpc('create_sitter_access', {
            p_pet_id: pet.id,
            p_expires_at: expiresAt.toISOString(),
            p_sitter_name: name,
            p_sitter_user_id: userId,
          });
        }
      }
    },
    [loadUsers, pets],
  );

  const handleDeleteMember = useCallback(
    async (userId: string) => {
      const { error } = await supabase.rpc('remove_sitter_member', { p_user_id: userId });
      if (error) throw error;
      await loadUsers();
    },
    [loadUsers],
  );

  if (sitterToken) {
    return (
      <div className="min-h-screen bg-cream-100">
        <div className="mx-auto min-h-screen max-w-lg px-5 pb-10 pt-7">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src="/petloop-logo.jpeg" alt="Petloop logo" className="h-full w-full object-cover" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-forest-700">Petloop</h1>
          </div>
          {loading ? (
            <p className="mt-16 text-center text-gray-400">Checking sitter access…</p>
          ) : sitterExpired ? (
            <div className="mt-20 rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <h2 className="text-xl font-extrabold text-gray-800">This link has expired</h2>
              <p className="mt-2 text-sm text-gray-400">Ask the pet owner to generate a new sitter link.</p>
            </div>
          ) : sitterUnavailable || !sitterPet || !sitterExpiresAt ? (
            <div className="mt-20 rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <h2 className="text-xl font-extrabold text-gray-800">This sitter link is unavailable</h2>
              <p className="mt-2 text-sm text-gray-400">Ask the pet owner to generate a new link.</p>
            </div>
          ) : (
            <SitterView
              pet={sitterPet}
              schedules={sitterSchedules}
              expiresAt={sitterExpiresAt}
              userId={sitterUserId}
              sitterName={sitterName}
              logs={logs}
              onLogCare={async (entry) => {
                const { error } = await supabase.from('logs').insert({
                  pet_id: entry.petId,
                  user_id: entry.userId,
                  type: entry.type,
                  note: entry.note || null,
                  created_at: entry.createdAt,
                });
                if (error) throw error;
                await loadLogs(entry.petId);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col">
        <header className="flex items-center gap-2.5 px-5 pb-2 pt-7">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
            <img
              src="/petloop-logo.jpeg"
              alt="Petloop logo"
              className="h-full w-full object-cover"
            />
          </span>
          <h1 className="flex-1 text-xl font-extrabold tracking-tight text-forest-700">Petloop</h1>
          {viewRole === 'owner' && (
            <button
              type="button"
              onClick={() => setTab('settings')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors ${
                tab === 'settings' ? 'text-forest-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Settings"
            >
              <SettingsIcon className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}
        </header>

        <div className="px-5 pb-3">
          <RoleSwitcher role={viewRole} onChange={setViewRole} />
        </div>

        {viewRole !== 'sitter' && (
          <MedicationBanner
            alerts={medicationAlerts}
            onDismiss={(key) => setDismissedMedicationAlerts((current) => new Set(current).add(key))}
            onOpen={(alert) => {
              setActivePetId(alert.pet.id);
              setLogActivityType('meds');
              setLogSelectionKey((key) => key + 1);
              setTab('log');
              loadLogs(alert.pet.id);
            }}
          />
        )}

        <main className="flex-1 px-5 pb-28 pt-4">
          {viewRole === 'sitter' ? (
            sitterPreviewLoading ? (
              <p className="mt-16 text-center text-gray-400">Loading sitter preview…</p>
            ) : !activePet ? (
              <p className="mt-16 text-center text-gray-400">No pet selected.</p>
            ) : !sitterPreview ? (
              <div className="mt-20 rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-xl font-extrabold text-gray-800">No sitter link yet</h2>
                <p className="mt-2 text-sm text-gray-400">Generate a sitter link from Settings to preview this view.</p>
              </div>
            ) : (
              <SitterView
                pet={activePet}
                schedules={schedules.filter((s) => s.pet_id === activePet.id)}
                expiresAt={sitterPreview.expiresAt}
                userId={sitterPreview.userId}
                sitterName={sitterPreview.sitterName}
                logs={logs}
                onLogCare={async (entry) => {
                  const { error } = await supabase.from('logs').insert({
                    pet_id: entry.petId,
                    user_id: entry.userId,
                    type: entry.type,
                    note: entry.note || null,
                    created_at: entry.createdAt,
                  });
                  if (error) throw error;
                  await loadLogs(entry.petId);
                }}
              />
            )
          ) : (
            <>
              {tab === 'dashboard' && (
                <Dashboard
                  pets={pets}
                  activePet={activePet}
                  logs={logs}
                  schedules={schedules}
                  loading={loading}
                  onPetChange={handlePetChange}
                  onAddPet={() => setShowAddPet(true)}
                  onSaveEmergencyInfo={handleSaveEmergencyInfo}
                />
              )}
              {tab === 'log' && (
                <QuickLog
                  pets={pets}
                  users={users}
                  schedules={schedules}
                  activePetId={activePetId}
                  onPetChange={handlePetChange}
                  onSave={handleSave}
                  onSaved={() => {
                    setTab('dashboard');
                    setLogActivityType(null);
                  }}
                  initialActivityType={logActivityType}
                  initialSelectionKey={logSelectionKey}
                />
              )}
              {tab === 'history' && (
                <History pets={pets} pet={activePet} onPetChange={handlePetChange} canDelete={viewRole === 'owner'} />
              )}
              {tab === 'settings' && viewRole === 'owner' && (
                <Settings
                  pets={pets}
                  users={users}
                  schedules={schedules}
                  onEditPet={handleEditPet}
                  onDeletePet={handleDeletePet}
                  onAddMember={handleAddMember}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                  onGenerateSitterLink={handleGenerateSitterLink}
                />
              )}
            </>
          )}
        </main>

        {viewRole !== 'sitter' && (
          <nav className="fixed bottom-0 left-1/2 w-full max-w-lg -translate-x-1/2 border-t border-gray-200 bg-cream-50/95 backdrop-blur">
            <div className="grid grid-cols-3">
              <TabButton
                active={tab === 'dashboard'}
                onClick={() => setTab('dashboard')}
                icon={<Home className="h-5 w-5" strokeWidth={1.75} />}
                label="Dashboard"
              />
              <TabButton
                active={tab === 'log'}
                onClick={() => setTab('log')}
                icon={<PlusCircle className="h-5 w-5" strokeWidth={1.75} />}
                label="Log"
              />
              <TabButton
                active={tab === 'history'}
                onClick={() => setTab('history')}
                icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />}
                label="History"
              />
            </div>
          </nav>
        )}
      </div>

      {showAddPet && <AddPet onSave={handleAddPet} onCancel={() => setShowAddPet(false)} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3.5 text-xs font-bold transition-colors ${
        active ? 'text-forest-600' : 'text-gray-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
