// Third-party video embed providers.
// All URLs are built from validated TMDB ids only (never raw user input).

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

export const EMBED_SOURCES: EmbedSource[] = [
  {
    key: 'vidsrc',
    name: 'VidSrc',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://vidsrc.sh/movies/${id}`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://vidsrc.sh/tv/${id}/${ep.season}/${ep.episode}`;
    },
  },
  {
    key: 'vidlink',
    name: 'VidLink',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://vidlink.pro/movie/${id}`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://vidlink.pro/tv/${id}/${ep.season}/${ep.episode}`;
    },
  },
  {
    key: 'vaplayer',
    name: 'VAPlayer',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://vaplayer.ru/movie/${id}/1`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://vaplayer.ru/tv/${id}/${ep.season}/${ep.episode}/1`;
    },
  },
  {
    key: 'vidrock',
    name: 'VidRock',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://vidrock.ru/movie/${id}`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://vidrock.ru/tv/${id}/${ep.season}/${ep.episode}`;
    },
  },
  {
    key: 'cinesrc',
    name: 'CineSrc',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://cinesrc.st/movie.php?id=${id}`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://cinesrc.st/tv.php?season=${ep.season}&episode=${ep.episode}&seria=${id}`;
    },
  },
  {
    key: 'vixsrc',
    name: 'VixSrc',
    url: (kind, id, ep) => {
      if (!isFinitePositiveInt(id)) return null;
      if (kind === 'movie') return `https://vixsrc.to/movie/${id}`;
      if (!ep || !isFinitePositiveInt(ep.season) || !isFinitePositiveInt(ep.episode)) return null;
      return `https://vixsrc.to/tv/${id}/${ep.season}/${ep.episode}`;
    },
  },
];

/** Sources that can currently serve this media/episode combination. */
export function availableEmbedSources(kind: EmbedMediaKind, tmdbId: number, episode?: EpisodeRef) {
  return EMBED_SOURCES.reduce<{ key: string; name: string; src: string }[]>((acc, source) => {
    const src = source.url(kind, tmdbId, episode);
    if (src) acc.push({ key: source.key, name: source.name, src });
    return acc;
  }, []);
}
