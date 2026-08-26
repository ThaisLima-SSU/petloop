import { useState } from 'react';
import { Check, Clipboard, Clock, Link, Loader2, X } from 'lucide-react';
import type { Pet } from '@/lib/supabase';

type SitterLinkModalProps = {
  pet: Pet;
  onGenerate: (petId: string, expiresAt: string, sitterName: string | null) => Promise<{ token: string; expiresAt: string }>;
  onCancel: () => void;
};

const EXPIRATIONS = [
  { value: '4h', label: 'Expires in 4 hours' },
  { value: 'today', label: 'Expires today at 9:00 PM' },
  { value: '24h', label: 'Expires in 24 hours' },
  { value: 'custom', label: 'Custom' },
];

function expirationDate(value: string, customHours: string, customDateTime: string) {
  if (value === 'custom' && customDateTime) return new Date(customDateTime);
  const date = new Date();
  if (value === 'today') {
    date.setHours(21, 0, 0, 0);
    if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  } else if (value === 'custom') {
    date.setHours(date.getHours() + Number(customHours || 1));
  } else {
    date.setHours(date.getHours() + (value === '4h' ? 4 : 24));
  }
  return date;
}

function formatExpiration(value: string) {
  return new Date(value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function SitterLinkModal({ pet, onGenerate, onCancel }: SitterLinkModalProps) {
  const [duration, setDuration] = useState('4h');
  const [customMode, setCustomMode] = useState<'hours' | 'date'>('hours');
  const [customHours, setCustomHours] = useState('6');
  const [customDateTime, setCustomDateTime] = useState('');
  const [sitterName, setSitterName] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setSaving(true);
    setError(null);
    try {
      const expiresAt = expirationDate(duration, customHours, customDateTime);
      if (duration === 'custom' && (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
        throw new Error('Please choose a future expiration.');
      }
      const result = await onGenerate(pet.id, expiresAt.toISOString(), sitterName.trim() || null);
      setLink(`${window.location.origin}${window.location.pathname}?sitter=${result.token}`);
      setExpiresAt(result.expiresAt);
    } catch {
      setError('Could not create a sitter link. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Share care access</p>
            <h3 className="text-lg font-extrabold text-forest-700">{pet.name}'s Sitter Link</h3>
          </div>
          <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!link ? (
          <>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Link expiration</span>
              <select value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 focus:border-forest-400 focus:outline-none">
                {EXPIRATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {duration === 'custom' && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
                <div className="mb-3 flex gap-2">
                  <button type="button" onClick={() => setCustomMode('hours')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${customMode === 'hours' ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-50'}`}>Hours from now</button>
                  <button type="button" onClick={() => setCustomMode('date')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${customMode === 'date' ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-50'}`}>Exact date & time</button>
                </div>
                {customMode === 'hours' ? (
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    Keep valid for
                    <input type="number" min="1" max="720" value={customHours} onChange={(event) => setCustomHours(event.target.value)} className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-gray-800 focus:border-forest-400 focus:outline-none" />
                    hours
                  </label>
                ) : (
                  <input type="datetime-local" value={customDateTime} onChange={(event) => setCustomDateTime(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 font-semibold text-gray-800 focus:border-forest-400 focus:outline-none" />
                )}
              </div>
            )}
            <label className="mb-5 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Sitter name (optional)</span>
              <input type="text" value={sitterName} onChange={(event) => setSitterName(event.target.value)} placeholder="e.g. Jordan" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal text-gray-800 focus:border-forest-400 focus:outline-none" />
            </label>
            {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            <button type="button" disabled={saving} onClick={handleGenerate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 font-extrabold text-white hover:bg-forest-600 disabled:opacity-50">
              {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating…</> : <><Link className="h-5 w-5" /> Generate Sitter Link</>}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-forest-100 bg-forest-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-forest-700"><Clock className="h-4 w-4" /> Expires {expiresAt && formatExpiration(expiresAt)}</div>
              <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600">{link}</p>
            </div>
            <button type="button" onClick={handleCopy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 font-extrabold text-white hover:bg-forest-600">
              {copied ? <><Check className="h-5 w-5" /> Link Copied</> : <><Clipboard className="h-5 w-5" /> Copy Link</>}
            </button>
            <button type="button" onClick={onCancel} className="mt-2 w-full rounded-2xl px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100">Done</button>
          </>
        )}
      </div>
    </div>
  );
}
