'use client';

import { useMemo, useState } from 'react';
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

export default function StreamPlayer({ tmdbId, mediaType, title, episode, sources }: StreamPlayerProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const active = useMemo(() => sources.find((source) => source.key === activeKey) || sources[0], [sources, activeKey]);
  if (sources.length === 0) return null;

  const label = episode ? `${title} S${episode.season}E${episode.episode}` : title;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-black">Watch options</h2>
        <p className="text-[10px] font-semibold text-[#8aa0b1]">Select a server to load the player</p>
      </div>
      {!expanded ? (
        <div className="rounded-[18px] border border-[#d8edf3] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <button
                key={source.key}
                type="button"
                className="rounded-full border border-[#cfe5ed] bg-[#f5fbfd] px-4 py-2 text-xs font-bold text-[#17324d] transition hover:border-[#ff6b4a] hover:text-[#ff6b4a]"
                onClick={() => { setActiveKey(source.key); setExpanded(true); }}
              >
                Play on {source.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#7891a3]">
            Player servers are provided by third parties. Hulu Crunchyroll does not host or control any video content;
            streams may be unavailable in your region.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-[#d8edf3] bg-[#102d43] shadow-[0_12px_35px_rgba(22,138,173,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source) => (
                <button
                  key={source.key}
                  type="button"
                  aria-pressed={active?.key === source.key}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    active?.key === source.key
                      ? 'border-[#ff6b4a] bg-[#ff6b4a] text-white'
                      : 'border-white/20 bg-white/10 text-[#d9eef5] hover:border-[#ff8a78] hover:text-white'
                  }`}
                  onClick={() => setActiveKey(source.key)}
                >
                  {source.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#d9eef5] hover:text-white"
              onClick={() => { setExpanded(false); setActiveKey(null); }}
            >
              Close player
            </button>
          </div>
          {active && (
            <div className="aspect-video w-full bg-black">
              <iframe
                // key forces a clean remount when switching servers
                key={`${tmdbId}-${mediaType}-${active.key}`}
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
          <p className="px-4 py-2.5 text-[10px] leading-4 text-[#8fb3c4]">
            Content served by {active?.name}. If this server fails, switch to another one above.
          </p>
        </div>
      )}
    </section>
  );
}
