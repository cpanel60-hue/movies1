'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Play, RefreshCw, ShieldCheck } from 'lucide-react';

type PlayerPanelProps = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  playerTemplate?: string;
  season?: number;
  episode?: number;
  contentType?: 'movie' | 'series' | 'episode';
};

function buildPlayerUrl(template: string | undefined, values: Record<string, string | number>) {
  const source = template?.trim() || 'https://playmogo.com/e/xgv6iwbwcxpe';
  const expanded = source.replace(/\{(id|type|season|episode|title)\}/g, (_match, key: string) =>
    encodeURIComponent(String(values[key] ?? '')),
  );
  try {
    const url = new URL(expanded);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function StreamPlayer({
  tmdbId,
  mediaType,
  title,
  playerTemplate,
  season,
  episode,
  contentType = mediaType === 'movie' ? 'movie' : 'series',
}: PlayerPanelProps) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const playerUrl = useMemo(() => buildPlayerUrl(playerTemplate, {
    id: tmdbId,
    type: mediaType,
    season: season ?? 1,
    episode: episode ?? 1,
    title,
  }), [playerTemplate, tmdbId, mediaType, season, episode, title, reload]);

  return (
    <section id="watch" className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
      <div className="overflow-hidden rounded-[22px] border border-[#d8edf3] bg-white shadow-[0_12px_35px_rgba(22,138,173,0.10)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5f1f5] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#168aad]">Hulu Crunchyroll</p>
            <h2 className="mt-1 text-lg font-black text-[#17324d]">{contentType === 'movie' ? 'Watch Full Movie' : contentType === 'episode' ? 'Watch Episode' : 'Watch Full Series'}</h2>
            <p className="mt-1 text-xs text-[#7891a3]">{title}{contentType !== 'movie' ? ' · Season ' + (season ?? 1) + (contentType === 'episode' ? ', Episode ' + (episode ?? 1) : '') : ''}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#e8f7fb] px-2.5 py-1 text-[10px] font-black text-[#168aad]">{contentType === 'movie' ? 'MOVIE' : contentType === 'episode' ? 'EPISODE' : 'SERIES'}</span><span className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[10px] font-black text-[#df6548]">HD · 4K when available</span><span className="rounded-full bg-[#f0f4f7] px-2.5 py-1 text-[10px] font-bold text-[#607b8e]">Quality depends on source</span></div>
          </div>
          {playerUrl && (
            <button type="button" onClick={() => { setLoaded(false); setReload((n) => n + 1); }} className="inline-flex items-center gap-2 rounded-full border border-[#cfe5ed] bg-[#f5fbfd] px-3 py-2 text-xs font-bold text-[#17324d] hover:border-[#168aad]">
              <RefreshCw size={13} /> Reload player
            </button>
          )}
        </div>
        {playerUrl ? (
          <div className="relative aspect-video bg-[#071521]">
            {!loaded && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#102d43] px-6 text-center text-white pointer-events-none"><span className="rounded-full bg-white/10 p-4"><Play size={24} fill="currentColor" /></span><p className="text-sm font-bold">Preparing {contentType === 'movie' ? 'your movie' : contentType === 'episode' ? 'this episode' : 'your series'}…</p><p className="text-xs text-[#b7d3df]">Playback quality and available episodes depend on the selected source.</p></div>}
            <iframe key={tmdbId + '-' + mediaType + '-' + (season ?? 1) + '-' + (episode ?? 1) + '-' + reload} src={playerUrl} title={title + ' player'} className="absolute inset-0 h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen onLoad={() => setLoaded(true)} />
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-9 text-center sm:py-12">
            <span className="rounded-2xl bg-[#e9faff] p-4 text-[#168aad]"><ShieldCheck size={25} /></span>
            <h3 className="mt-4 text-base font-black text-[#17324d]">Choose an official viewing option</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#6b8496]">A licensed player has not been configured yet. Check the official availability options below; the player appears here once your licensed HTTPS embed URL is configured.</p>
            <a href="#watch-providers" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b4a] px-4 py-2.5 text-xs font-black text-white hover:bg-[#ed5939]">View watch options <ExternalLink size={13} /></a>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#e5f1f5] bg-[#f8fcfd] px-4 py-3 text-[10px] leading-4 text-[#7891a3] sm:px-5">
          <ShieldCheck size={13} className="shrink-0 text-[#168aad]" />
          Playback availability depends on your licensed provider and region.
        </div>
      </div>
    </section>
  );
}
