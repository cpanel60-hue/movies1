import Link from 'next/link';

export default function LegalFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0e0e1d] px-4 py-10 text-sm text-[#cfe7ef]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" aria-label="Hulu Crunchyroll home" className="font-black tracking-tight text-white">HULU <span className="text-[#168aad]">CRUNCHYROLL</span></Link>
            <p className="mt-1 text-xs text-[#9fc0cc]">Find your next favorite watch.</p>
          </div>
          <nav aria-label="Hulu Crunchyroll information and legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/guides" className="hover:text-white">Guides</Link>
            <Link href="/faq" className="hover:text-white">FAQ</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/dmca" className="hover:text-white">DMCA / Report</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
        </div>
        <p className="text-xs leading-5 text-[#9fc0cc]">
          © {new Date().getFullYear()} Hulu Crunchyroll. No account, OTP, password or payment information is required to browse the public site. Limited technical and aggregated analytics may be processed for traffic, reliability and security. Metadata and images are provided by third-party services. Hulu Crunchyroll does not host movie or TV video files.
        </p>
        <div className="border-t border-white/10 pt-4 text-xs leading-5 text-[#9fc0cc]">
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB. <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="font-medium text-[#d7edf4] hover:text-white">The Movie Database (TMDB)</a></p>
        </div>
      </div>
    </footer>
  );
}
