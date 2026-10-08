import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { slugify, type TmdbDiscoverOptions, type TmdbMediaType, type TmdbTitle } from './tmdb';
import { evaluateQualityGate } from './quality-gate';

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const SITEMAP_PAGE_SIZE = 1000;
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type CatalogCategory = 'movies' | 'series' | 'anime';

type CatalogRow = {
  id: string;
  tmdb_id: number;
  media_type: TmdbMediaType;
  slug: string;
  title: string;
  overview: string | null;
  poster_path: string | null;
  raw: TmdbTitle | null;
  indexable: boolean;
  quality_state: string;
  quality_score: number;
  quality_attempts: number;
  quality_next_attempt_at: string | null;
  content_hash: string | null;
  last_synced_at?: string | null;
};

function sqlClient() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(DATABASE_URL);
}

function titleOf(item: TmdbTitle) {
  return item.title || item.name || item.original_title || item.original_name || 'Untitled';
}

function isAnimeTitle(item: TmdbTitle) {
  return item.original_language === 'ja' && Boolean(item.genres?.some(g => g.id === 16) || item.genre_ids?.includes(16));
}

function mapCandidate(item: TmdbTitle, mediaType: TmdbMediaType, source: string) {
  const now = new Date().toISOString();
  return {
    tmdb_id: item.id,
    media_type: mediaType,
    slug: `${slugify(titleOf(item))}-${item.id}`,
    title: titleOf(item),
    original_title: item.original_title || item.original_name || null,
    overview: item.overview || null,
    tagline: item.tagline || null,
    original_language: item.original_language || null,
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    runtime: item.runtime ?? null,
    number_of_seasons: item.number_of_seasons ?? null,
    number_of_episodes: item.number_of_episodes ?? null,
    vote_average: item.vote_average ?? null,
    vote_count: item.vote_count ?? null,
    popularity: item.popularity ?? null,
    status: item.status || null,
    homepage: item.homepage || null,
    adult: Boolean(item.adult),
    last_discovered_at: now,
    discovery_source: source,
    is_anime: isAnimeTitle(item),
  };
}

export async function upsertDiscoveredTitles(items: TmdbTitle[], mediaType: TmdbMediaType, source: string) {
  const payload = items.filter(item => Number.isInteger(item.id) && item.id > 0 && !item.adult).map(item => mapCandidate(item, mediaType, source));
  if (!payload.length) return 0;
  const db = sqlClient();
  const columns = ['tmdb_id','media_type','slug','title','original_title','overview','tagline','original_language','poster_path','backdrop_path','release_date','first_air_date','runtime','number_of_seasons','number_of_episodes','vote_average','vote_count','popularity','status','homepage','adult','last_discovered_at','discovery_source','is_anime'];
  const values: unknown[] = [];
  const rows = payload.map(row => {
    const placeholders = columns.map(column => {
      values.push((row as Record<string, unknown>)[column]);
      return '$' + values.length;
    });
    return `(${placeholders.join(',')})`;
  });
  await db.query(`INSERT INTO titles (${columns.join(',')}) VALUES ${rows.join(',')} ON CONFLICT (tmdb_id,media_type) DO UPDATE SET
    slug=EXCLUDED.slug,title=EXCLUDED.title,original_title=EXCLUDED.original_title,overview=EXCLUDED.overview,tagline=EXCLUDED.tagline,
    original_language=EXCLUDED.original_language,poster_path=EXCLUDED.poster_path,backdrop_path=EXCLUDED.backdrop_path,
    release_date=EXCLUDED.release_date,first_air_date=EXCLUDED.first_air_date,runtime=EXCLUDED.runtime,
    number_of_seasons=EXCLUDED.number_of_seasons,number_of_episodes=EXCLUDED.number_of_episodes,vote_average=EXCLUDED.vote_average,
    vote_count=EXCLUDED.vote_count,popularity=EXCLUDED.popularity,status=EXCLUDED.status,homepage=EXCLUDED.homepage,adult=EXCLUDED.adult,
    last_discovered_at=EXCLUDED.last_discovered_at,discovery_source=EXCLUDED.discovery_source,is_anime=EXCLUDED.is_anime,
    updated_at=now(), quality_state=CASE WHEN titles.quality_state='ready' THEN titles.quality_state ELSE 'pending' END`, values);
  return payload.length;
}

export async function getCatalogTitle(mediaType: TmdbMediaType, tmdbId: number) {
  const db = sqlClient();
  const rows = await db.query<CatalogRow[]>(`SELECT id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at
    FROM titles WHERE tmdb_id=$1 AND media_type=$2 LIMIT 1`, [tmdbId, mediaType]);
  return rows[0] || null;
}

export async function getPendingCatalogTitles(limit: number) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const db = sqlClient();
  const pending = await db.query<CatalogRow[]>(`SELECT id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at
    FROM titles WHERE quality_state='pending' ORDER BY popularity DESC NULLS LAST,updated_at ASC LIMIT $1`, [safeLimit]);
  const rows = [...pending];
  if (rows.length < safeLimit) {
    const retry = await db.query<CatalogRow[]>(`SELECT id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at
      FROM titles WHERE quality_state='error' AND quality_attempts < 5 AND quality_next_attempt_at <= now()
      ORDER BY quality_attempts ASC,popularity DESC NULLS LAST,updated_at ASC LIMIT $1`, [safeLimit - rows.length]);
    rows.push(...retry);
  }
  if (rows.length < safeLimit) {
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
    const stale = await db.query<CatalogRow[]>(`SELECT id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at
      FROM titles WHERE quality_state='ready' AND last_synced_at < $1
      ORDER BY popularity DESC NULLS LAST,last_synced_at ASC LIMIT $2`, [staleBefore, safeLimit - rows.length]);
    rows.push(...stale);
  }
  return rows;
}

export async function updateCatalogAfterEnrichment(row: CatalogRow, detail: TmdbTitle) {
  const now = new Date().toISOString();
  const quality = evaluateQualityGate({
    title: titleOf(detail), overview: detail.overview, posterPath: detail.poster_path, genres: detail.genres,
    castCount: detail.credits?.cast?.length,
    trailerAvailable: detail.videos?.results?.some(video => video.site === 'YouTube' && video.type === 'Trailer'),
    recommendationCount: detail.recommendations?.results?.filter(item => item.poster_path).length,
  });
  const contentHash = createHash('sha256').update(JSON.stringify(detail)).digest('hex');
  const contentChanged = row.content_hash !== contentHash;
  const db = sqlClient();
  const rows = await db.query<CatalogRow[]>(`UPDATE titles SET
    slug=$1,title=$2,original_title=$3,overview=$4,tagline=$5,original_language=$6,poster_path=$7,backdrop_path=$8,
    release_date=$9,first_air_date=$10,runtime=$11,number_of_seasons=$12,number_of_episodes=$13,vote_average=$14,vote_count=$15,
    popularity=$16,status=$17,homepage=$18,adult=$19,raw=$20,indexable=$21,quality_score=$22,quality_state='ready',
    quality_checked_at=$23,quality_error=NULL,content_hash=$24,quality_attempts=0,quality_next_attempt_at=NULL,
    last_synced_at=$23,updated_at=$23,last_content_change_at=CASE WHEN $25 THEN $23 ELSE last_content_change_at END,is_anime=$26
    WHERE id=$27 RETURNING id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at`,
    [`${slugify(titleOf(detail))}-${detail.id}`,titleOf(detail),detail.original_title || detail.original_name || null,detail.overview || null,detail.tagline || null,
     detail.original_language || null,detail.poster_path || null,detail.backdrop_path || null,detail.release_date || null,detail.first_air_date || null,
     detail.runtime ?? null,detail.number_of_seasons ?? null,detail.number_of_episodes ?? null,detail.vote_average ?? null,detail.vote_count ?? null,
     detail.popularity ?? null,detail.status || null,detail.homepage || null,Boolean(detail.adult),detail, !detail.adult && quality.indexable,quality.score,now,
     contentHash,contentChanged || !row.raw,isAnimeTitle(detail),row.id]);
  return { quality, changed: contentChanged || !row.raw, row: rows[0] || null, response: null };
}

export async function markCatalogEnrichmentError(row: CatalogRow, error: unknown) {
  const previousAttempts = Number(row.quality_attempts || 0);
  const attempts = previousAttempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/HTTP (\d{3})/);
  const status = statusMatch ? Number(statusMatch[1]) : 0;
  const db = sqlClient();
  if (status === 404) {
    await db.query(`UPDATE titles SET indexable=false,quality_state='removed',quality_error='TMDB title not found',quality_checked_at=now(),quality_next_attempt_at=NULL,updated_at=now() WHERE id=$1`, [row.id]);
    return { state: 'removed' as const };
  }
  const delayMinutes = status === 429 ? 30 : Math.min(360, 15 * 2 ** Math.min(attempts - 1, 4));
  const nextAttempt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
  await db.query(`UPDATE titles SET indexable=false,quality_state='error',quality_error=$1,quality_checked_at=now(),quality_attempts=$2,quality_next_attempt_at=$3,updated_at=now() WHERE id=$4`, [message.slice(0,500),attempts,nextAttempt,row.id]);
  return { state: 'error' as const };
}

function categoryFilters(category: CatalogCategory) {
  if (category === 'movies') return { mediaType: 'movie' as const, anime: false };
  if (category === 'series') return { mediaType: 'tv' as const, anime: false };
  return { anime: true };
}

export async function countCatalogSitemap(category: CatalogCategory) {
  const filters = categoryFilters(category);
  const db = sqlClient();
  const values: unknown[] = [];
  let where = `indexable=true AND quality_state='ready'`;
  if (filters.mediaType) { values.push(filters.mediaType); where += ` AND media_type=$${values.length}`; }
  values.push(filters.anime); where += ` AND is_anime=$${values.length}`;
  const rows = await db.query<{count:string}[]>(`SELECT count(*)::text AS count FROM titles WHERE ${where}`, values);
  return Number(rows[0]?.count || 0);
}

export async function getCatalogSitemapRows(category: CatalogCategory, part: number) {
  const filters = categoryFilters(category);
  const db = sqlClient();
  const values: unknown[] = [];
  let where = `indexable=true AND quality_state='ready'`;
  if (filters.mediaType) { values.push(filters.mediaType); where += ` AND media_type=$${values.length}`; }
  values.push(filters.anime); where += ` AND is_anime=$${values.length}`;
  values.push(part * SITEMAP_PAGE_SIZE); const offsetParam = values.length;
  values.push(SITEMAP_PAGE_SIZE); const limitParam = values.length;
  return db.query<Array<{slug:string;tmdb_id:number;media_type:TmdbMediaType;last_content_change_at:string|null;updated_at:string}>>(
    `SELECT slug,tmdb_id,media_type,last_content_change_at,updated_at FROM titles WHERE ${where} ORDER BY id ASC OFFSET $${offsetParam} LIMIT $${limitParam}`, values);
}

export async function getSyncShards(limit: number) {
  const db = sqlClient();
  return db.query<Array<{id:string;shard_key:string;media_type:TmdbMediaType;shard_kind:string;filters:TmdbDiscoverOptions;next_page:number;completed:boolean;priority:number;pages_fetched:number;items_seen:number;last_run_at:string|null;last_error:string|null;locked_until:string|null}>>(
    `SELECT id,shard_key,media_type,shard_kind,filters,next_page,completed,priority,pages_fetched,items_seen,last_run_at,last_error,locked_until
     FROM catalog_sync_shards WHERE completed=false ORDER BY priority DESC,last_run_at ASC NULLS FIRST,next_page ASC LIMIT $1`, [Math.max(1, Math.min(limit,100))]);
}

export async function lockSyncShard(id: string) {
  const db = sqlClient();
  const lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
  await db.query(`UPDATE catalog_sync_shards SET locked_until=$1,updated_at=now() WHERE id=$2 AND completed=false`, [lockedUntil,id]);
  return lockedUntil;
}

export async function updateSyncShard(id: string, patch: Record<string, unknown>) {
  const allowed = ['next_page','completed','pages_fetched','items_seen','last_run_at','last_error','locked_until'];
  const keys = Object.keys(patch).filter(key => allowed.includes(key));
  if (!keys.length) return;
  const db = sqlClient();
  const values = keys.map(key => patch[key]);
  const sets = keys.map((key,index) => `${key}=$${index+1}`);
  values.push(id);
  await db.query(`UPDATE catalog_sync_shards SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length}`, values);
}

export async function createSyncShards(rows: Array<{shard_key:string;media_type:TmdbMediaType;shard_kind:'year'|'month'|'language_month'|'genre_language_month'|'vote_bucket'|'anime_year'|'anime_month'|'anime_language_month';filters:TmdbDiscoverOptions;priority?:number}>) {
  if (!rows.length) return 0;
  const db = sqlClient();
  const values: unknown[] = [];
  const tuples = rows.map(row => {
    const p1=values.push(row.shard_key); const p2=values.push(row.media_type); const p3=values.push(row.shard_kind);
    const p4=values.push(JSON.stringify(row.filters)); const p5=values.push(row.priority ?? 0);
    return `($${p1},$${p2},$${p3},$${p4}::jsonb,$${p5})`;
  });
  await db.query(`INSERT INTO catalog_sync_shards (shard_key,media_type,shard_kind,filters,priority) VALUES ${tuples.join(',')} ON CONFLICT (shard_key) DO NOTHING`, values);
  return rows.length;
}

export async function startSyncRun(source: string, requestedCount = 0) {
  const db = sqlClient();
  const rows = await db.query<Array<{id:string}>>(`INSERT INTO sync_runs (source,requested_count) VALUES ($1,$2) RETURNING id`, [source,requestedCount]);
  return rows[0]?.id || null;
}

export async function finishSyncRun(id: string | null, patch: Record<string, unknown>) {
  if (!id) return;
  const allowed = ['status','synced_count','error'];
  const keys = Object.keys(patch).filter(key => allowed.includes(key));
  const db = sqlClient();
  const values = keys.map(key => patch[key]);
  const sets = keys.map((key,index) => `${key}=$${index+1}`);
  values.push(id);
  await db.query(`UPDATE sync_runs SET ${sets.join(',')},finished_at=now() WHERE id=$${values.length}`, values);
}
