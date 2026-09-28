import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'CliniqX — Smart Clinic. Connected Care.', template: '%s · CliniqX' },
  description:
    'CliniqX is a connected digital operating system for modern clinics: appointments, queue, consultations, prescriptions, labs, pharmacy and records in one place.',
  applicationName: 'CliniqX',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'CliniqX', statusBarStyle: 'default' },
  // Clinical records must never be indexed or previewed by crawlers.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
