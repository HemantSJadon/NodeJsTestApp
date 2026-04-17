import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MBA GD Simulator — Practice Group Discussions with AI',
  description:
    'Simulate realistic MBA group discussions with AI candidates and an AI moderator. Get reviewed and improve your GD skills.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F172A] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
