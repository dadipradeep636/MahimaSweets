import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop controls | Mahima Sweets',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
