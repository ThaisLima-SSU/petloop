import { useEffect, useState } from 'react';
import { Copy, Loader2, PawPrint, X, Check, Clock } from 'lucide-react';
import { supabase, type Pet, type User } from '@/lib/supabase';

type SitterLinksModalProps = {
  member: User;
  pets: Pet[];
  onCancel: () => void;
};

type SitterLink = {
  pet_id: string;
  pet_name: string;
  token: string;
  expires_at: string;
};

export function SitterLinksModal({ member, pets, onCancel }: SitterLinksModalProps) {
  const [links, setLinks] = useState<SitterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.rpc('get_sitter_links_by_user', { p_sitter_user_id: member.id });
      if (cancelled) return;
      let existing = (data ?? []) as SitterLink[];
      const existingPetIds = new Set(existing.map((l) => l.pet_id));
      const missing = pets.filter((p) => !existingPetIds.has(p.id));
      if (missing.length > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        for (const pet of missing) {
          await supabase.rpc('create_sitter_access', {
            p_pet_id: pet.id,
            p_expires_at: expiresAt.toISOString(),
            p_sitter_name: member.name,
            p_sitter_user_id: member.id,
          });
        }
        const { data: refreshed } = await supabase.rpc('get_sitter_links_by_user', { p_sitter_user_id: member.id });
        existing = (refreshed ?? []) as SitterLink[];
      }
      if (cancelled) return;
      setLinks(existing);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [member.id, member.name, pets]);

  function buildUrl(token: string) {
    return `${window.location.origin}${window.location.pathname}?sitter=${token}`;
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(buildUrl(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // clipboard not available
    }
  }

  function formatExpiry(expiresAt: string) {
    const date = new Date(expiresAt);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days (${date.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
            <h3 className="text-lg font-extrabold text-forest-700">{member.name}'s Sitter Links</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> <span className="ml-2 text-sm font-semibold">Loading links…</span>
          </div>
        ) : links.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No pets available to generate links for.</p>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.token} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-1 font-bold text-gray-800">{link.pet_name}</p>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatExpiry(link.expires_at)}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={buildUrl(link.token)}
                    className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={() => copyLink(link.token)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-50 px-3 py-2 text-xs font-bold text-forest-600 hover:bg-forest-100"
                  >
                    {copiedToken === link.token ? (
                      <><Check className="h-3.5 w-3.5" strokeWidth={2} /> Copied</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" strokeWidth={1.75} /> Copy</>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
