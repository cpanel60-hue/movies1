// Third-party video embed providers.
// All URLs are built from validated TMDB ids only (never raw user input).
// The list is ordered: index 0 = primary server, the rest are automatic
// fallbacks — if a title cannot be found on one server, the next one is tried.

export type EmbedMediaKind = 'movie' | 'tv';

export interface EpisodeRef {
  season: number;
  episode: number;
}

export interface EmbedSource {
  key: string;
  name: string;
  /** Returns the iframe src, or null when this provider cannot serve the request (e.g. missing episode for a TV show). */
  url: (kind: EmbedMediaKind, tmdbId: number, episode?: EpisodeRef) => string | null;
}

const isFinitePositiveInt = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n > 0;

const validEpisode = (ep: EpisodeRef | undefined): ep is EpisodeRef =>
  !!ep && isFinitePositiveInt(ep.season) && isFinitePositiveInt(ep.episode);

/** Simple TMDB-based pattern: /prefix/movie/{id} & /prefix/tv/{id}/{s}/{e} */
const slashPattern = (key: string, name: string, base: string, suffix = ''): EmbedSource => ({
  key,
  name,
  url: (kind, id, ep) => {
    if (!isFinitePositiveInt(id)) return null;
    if (kind === 'movie') return `${base}/movie/${id}${suffix}`;
    if (!validEpisode(ep)) return null;
    return `${base}/tv/${id}/${ep.season}/${ep.episode}${suffix}`;
  },
});

/** vidsrc-style pattern: /embed/movie/{id} & /embed/tv/{id}/{s}/{e} */
const embedPattern = (key: string, name: string, base: string): EmbedSource => ({
  key,
  name,
  url: (kind, id, ep) => {
    if (!isFinitePositiveInt(id)) return null;
    if (kind === 'movie') return `${base}/embed/movie/${id}`;
    if (!validEpisode(ep)) return null;
    return `${base}/embed/tv/${id}/${ep.season}/${ep.episode}`;
  },
});

export const EMBED_SOURCES: EmbedSource[] = [
  // ---- Original six (verified live where possible) ----
  embedPattern('vidsrc', 'VidSrc.sh', 'https://vidsrc.sh'),
  slashPattern('vidlink', 'VidLink.pro', 'https://vidlink.pro'),
  slashPattern('vaplayer', 'VAPlayer.ru', 'https://vaplayer.ru', '/1'),
  slashPattern('vidrock', 'VidRock.to', 'https://vidrock.to'), // vidrock.ru migrated to vidrock.to
  {
    key: 'cinesrc',
    name: 'CineSrc.st',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      // Official pattern (verified against cinesrc.st/docs): /embed/movie/{tmdb} & /embed/tv/{tmdb}?s=&e=
      if (kind === 'movie') return `https://cinesrc.st/embed/movie/${id}`;
      if (!validEpisode(ep)) return null;
      return `https://cinesrc.st/embed/tv/${id}?s=${ep.season}&e=${ep.episode}`;
    },
  },
  slashPattern('vixsrc', 'VixSrc.to', 'https://vixsrc.to'), // currently returning 403 — kept last as fallback

  // ---- Additional TMDB-compatible mirrors (fallback pool) ----
  embedPattern('vidsrc-cc', 'VidSrc.cc', 'https://vidsrc.cc'),
  embedPattern('vidsrc-xyz', 'VidSrc.xyz', 'https://vidsrc.xyz'),
  slashPattern('2put', '2Put.io', 'https://2put.io'),
  {
    key: 'multiembed',
    name: 'MultiEmbed',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      // MultiEmbed auto-picks the best working source internally — great safety net.
      if (kind === 'movie') return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      if (!validEpisode(ep)) return null;
      return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${ep.season}&e=${ep.episode}`;
    },
  },
];

/** Sources that can currently serve this media/episode combination, in priority order. */
export function availableEmbedSources(kind: EmbedMediaKind, tmdbId: number, episode?: EpisodeRef) {
  return EMBED_SOURCES.reduce<{ key: string; name: string; src: string }[]>((acc, source) => {
    const src = source.url(kind, tmdbId, episode);
    if (src) acc.push({ key: source.key, name: source.name, src });
    return acc;
  }, []);
}
