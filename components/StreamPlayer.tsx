'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedMediaKind, EpisodeRef } from '@/lib/embed-sources';

interface Source {
  key: string;
  name: string;
  src: string;
}

interface StreamPlayerProps {
  tmdbId: number;
  mediaType: EmbedMediaKind;
  title: string;
  episode?: EpisodeRef;
  sources: Source[];
}

/**
 * Player with automatic fallback: servers are tried in order. If the active
 * server cannot load (blocked/offline) or its embed reports "not found",
 * the next server is loaded automatically — until one works.
 */
export default function StreamPlayer({ tmdbId, mediaType, title, episode, sources }: StreamPlayerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [failedKeys, setFailedKeys] = useState<string[]>([]);
  const [reloadNonce, setReloadNonce] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the media/episode changes (e.g. switching seasons).
  useEffect(() => {
    setActiveIndex(null);
    setExpanded(false);
    setFailedKeys([]);
  }, [tmdbId, mediaType, episode?.season, episode?.episode]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const workingSources = useMemo(
    () => sources.filter((source) => !failedKeys.includes(source.key)),
    [sources, failedKeys],
  );

  const active = activeIndex !== null ? sources[activeIndex] : undefined;

  /** Move to the next server that has not already failed. */
  const advance = useCallback((fromIndex: number, failedKey: string) => {
    setFailedKeys((prev) => (prev.includes(failedKey) ? prev : [...prev, failedKey]));
    for (let i = fromIndex + 1; i < sources.length; i += 1) {
      if (!failedKeys.includes(sources[i].key)) {
        setActiveIndex(i);
        return;
      }
    }
    // No untouched server left: fall back to retrying the first one after a pause.
    setActiveIndex(sources.length > 1 ? 0 : null);
  }, [sources, failedKeys]);

  const markFailed = useCallback((index: number, key: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance(index, key);
  }, [advance]);

  const handleSelect = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIndex(index);
    setExpanded(true);
  };

  // Safety net: if the iframe's page itself does not respond within 12s, try the next server.
  useEffect(() => {
    if (!active || !expanded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const idx = sources.findIndex((s) => s.key === active.key);
    timerRef.current = setTimeout(() => markFailed(idx, active.key), 12_000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key, expanded, reloadNonce]);

  if (sources.length === 0) return null;

  const label = episode ? `${title} S${episode.season}E${episode.episode}` : title;
  const allFailed = workingSources.length === 0;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-black">Watch options</h2>
        <p className="text-[10px] font-semibold text-[#8aa0b1]">
          {allFailed ? 'All servers were tried — pick one to retry' : `Servers auto-fallback if a title is unavailable`}
        </p>
      </div>
      {!expanded ? (
        <div className="rounded-[18px] border border-[#d8edf3] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <button
                key={source.key}
                type="button"
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                  failedKeys.includes(source.key)
                    ? 'border-[#e5d3cf] bg-[#faf4f3] text-[#b9a49f] line-through'
                    : 'border-[#cfe5ed] bg-[#f5fbfd] text-[#17324d] hover:border-[#ff6b4a] hover:text-[#ff6b4a]'
                }`}
                onClick={() => handleSelect(index)}
              >
                Play on {source.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#7891a3]">
            Player servers are provided by third parties. Hulu Crunchyroll does not host or control any video content;
            streams may be unavailable in your region. If a server does not have this title, the next one loads automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-[#d8edf3] bg-[#102d43] shadow-[0_12px_35px_rgba(22,138,173,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source, index) => (
                <button
                  key={source.key}
                  type="button"
                  aria-pressed={active?.key === source.key}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    active?.key === source.key
                      ? 'border-[#ff6b4a] bg-[#ff6b4a] text-white'
                      : failedKeys.includes(source.key)
                        ? 'border-white/10 bg-white/5 text-[#6f8ea1] line-through'
                        : 'border-white/20 bg-white/10 text-[#d9eef5] hover:border-[#ff8a78] hover:text-white'
                  }`}
                  onClick={() => handleSelect(index)}
                >
                  {source.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#d9eef5] hover:text-white"
              onClick={() => { setExpanded(false); setActiveIndex(null); }}
            >
              Close player
            </button>
          </div>
          {active && !allFailed && (
            <div className="aspect-video w-full bg-black">
              <iframe
                // key forces a clean remount when switching servers or retrying
                key={`${tmdbId}-${mediaType}-${active.key}-${reloadNonce}`}
                className="h-full w-full"
                src={active.src}
                title={`${label} on ${active.name}`}
                loading="lazy"
                referrerPolicy="origin"
                allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          )}
          {allFailed && (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black px-6 text-center">
              <p className="text-sm font-bold text-[#d9eef5]">No server responded for {label}.</p>
              <p className="text-[11px] text-[#8fb3c4]">This happens when the title is brand new or temporarily offline everywhere.</p>
              <button
                type="button"
                className="rounded-full border border-[#ff6b4a] bg-[#ff6b4a] px-4 py-2 text-xs font-bold text-white"
                onClick={() => { setFailedKeys([]); setActiveIndex(0); setReloadNonce((n) => n + 1); }}
              >
                Retry all servers
              </button>
            </div>
          )}
          <p className="px-4 py-2.5 text-[10px] leading-4 text-[#8fb3c4]">
            {allFailed
              ? 'You can manually pick a server above to try again.'
              : `Currently serving from ${active?.name}. Other servers stay as automatic fallbacks.`}
          </p>
        </div>
      )}
    </section>
  );
}
