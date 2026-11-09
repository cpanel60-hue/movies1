import type { Metadata } from 'next';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';
import SiteHeader from '@/components/SiteHeader';
import VercelAnalyticsScript from '@/components/VercelAnalyticsScript';

export const dynamic = 'force-dynamic';
import AdSenseUnit from '@/components/AdSenseUnit';

const GOOGLE_SITE_VERIFICATION = '-npDm0pPUxzUXuY0AnLJyAZ-g5pqBWeOaJsp3wlzLv4';
const BING_SITE_VERIFICATION = '84783D6C29D7BA1FE3D5503CF8ABF55D';
const YANDEX_SITE_VERIFICATION = '512bbf7efb34a7ed';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hulucrunchyroll.vercel.app';
const ADSENSE_ACCOUNT = 'ca-pub-2298621556332463';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Hulu Crunchyroll – Full Movie Streaming HD & 4K | Full Series Streaming', template: '%s | Hulu Crunchyroll' },
  description: 'Stream full movies, full TV series and anime on Hulu Crunchyroll. Explore HD and 4K streaming titles, popular movies, series, episodes and anime.',
  applicationName: 'Hulu Crunchyroll',
  keywords: ['Hulu Crunchyroll', 'movies', 'TV series', 'films', 'movie discovery', 'what to watch', 'movie recommendations', 'trailers'],
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: { title: 'Hulu Crunchyroll – Movies & TV Series Discovery', description: 'Explore full movie streaming, full series streaming and anime on Hulu Crunchyroll. HD and 4K quality when available.', type: 'website', url: SITE_URL, siteName: 'Hulu Crunchyroll' },
  twitter: { card: 'summary_large_image', title: 'Hulu Crunchyroll – Movies & TV Series Discovery', description: 'Full movie and full series streaming in HD and 4K when available.' },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    other: {
      'msvalidate.01': BING_SITE_VERIFICATION,
      'yandex-verification': YANDEX_SITE_VERIFICATION,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content={ADSENSE_ACCOUNT} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <VercelAnalyticsScript />
        <SiteHeader />
        {children}
        <AdSenseUnit />
        <LegalFooter />
      </body>
    </html>
  );
}
