import type { Metadata } from 'next';
import CatalogHome from '@/components/CatalogHome';
import AiSeoSignals from '@/components/AiSeoSignals';
import { tmdbAnimeHome, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hulucrunchyroll.vercel.app';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Hulu Crunchyroll – Decide What to Watch | Movies, Series & Anime Discovery',
  description: 'Decide what to watch with Hulu Crunchyroll. Discover movies, series and anime by mood, time, genre, pace and viewing context.',
  keywords: ['what to watch', 'movie recommendations', 'TV recommendations', 'anime recommendations', 'movies by mood', 'Hulu Crunchyroll Discover'],
  alternates: { canonical: SITE_URL },
  openGraph: { title: 'Hulu Crunchyroll – Decide What to Watch', description: 'Discover movies, series and anime matched to your mood, time and viewing context.', url: SITE_URL, type: 'website', siteName: 'Hulu Crunchyroll' },
};
const empty = { results: [] };

export default async function HomePage() {
  const [trending, popularMovies, popularSeries, latestMovies, upcoming, anime] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => empty),
    tmdbPopular('movie').catch(() => empty),
    tmdbPopular('tv').catch(() => empty),
    tmdbNowPlaying().catch(() => empty),
    tmdbUpcoming().catch(() => empty),
    tmdbAnimeHome().catch(() => empty),
  ]);

  const websiteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Hulu Crunchyroll', url: SITE_URL, description: 'A movie, TV series and anime discovery platform that helps people decide what to watch based on mood, time and viewing context.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  const organizationLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Hulu Crunchyroll', url: SITE_URL };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
    <CatalogHome trending={trending.results} popularMovies={popularMovies.results} popularSeries={popularSeries.results.map((x) => ({ ...x, media_type: 'tv' as const }))} latestMovies={latestMovies.results.map((x) => ({ ...x, media_type: 'movie' as const }))} upcoming={upcoming.results.map((x) => ({ ...x, media_type: 'movie' as const }))} anime={anime.results} />
    <AiSeoSignals />
  </>;
}
