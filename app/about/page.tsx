import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Hulu Crunchyroll',
  description: 'Learn about Hulu Crunchyroll, a movie, series and anime discovery platform with title information, genres, trailers and viewing guidance.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-zinc-800">
      <article className="prose prose-zinc max-w-none">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">About Hulu Crunchyroll</p>
        <h1>Helping you decide what to watch</h1>
        <p>
          Hulu Crunchyroll helps viewers explore movies, TV series and anime. Browse titles by genre, popularity, release date and other catalogue details, then use trailers, cast information and related recommendations to decide what to watch.
        </p>
        <h2>What makes Hulu Crunchyroll useful</h2>
        <p>
          A title page is designed to do more than display a poster and a score. Hulu Crunchyroll presents title details, trailers, genres, cast information and related recommendations to help visitors compare titles and choose what to watch. We also provide trailers, title details, genres, cast information, and related recommendations to help you make an informed choice.
        </p>
        <h2>How our recommendations work</h2>
        <p>
          Discovery pages organize catalogue information such as popularity, genre, release timing and related titles. Recommendations are suggestions and may not match every viewer's taste.
        </p>
        <h2>How we approach editorial content</h2>
        <p>
          We aim to make catalogue pages clear and easy to navigate. Site information and editorial pages may be updated as the catalogue and available features change.
        </p>
        <h2>Third-party data and media</h2>
        <p>
          Hulu Crunchyroll may use third-party services for catalogue metadata, artwork and trailers. Third-party material remains subject to its respective provider's terms and rights. Rights to third-party movie, TV, poster, cast and trailer content remain with their respective owners.
        </p>
        <h2>Questions, corrections, or copyright concerns</h2>
        <p>
          If you need to report an issue, request a correction, or raise a copyright concern, please use our Contact and DMCA pages. Include the relevant page URL and enough detail for the issue to be reviewed. Valid reports are handled according to the applicable site policies.
        </p>
      </article>
    </main>
  );
}
