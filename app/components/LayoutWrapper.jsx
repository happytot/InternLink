'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

import { Toaster } from 'sonner';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Routes where you want to hide header/footer
  const hiddenRoutes = ['/coordinator/students', 
                        '/coordinator/dashboard', 
                       '/coordinator/approvals',
                       '/coordinator/announcements',
                       '/coordinator/settings',
                       '/coordinator/companies'
                      ];

  const shouldHideLayout = hiddenRoutes.some((route) => pathname.startsWith(route));

  return (
    <>
      {!shouldHideLayout && <Header />}
      <Toaster richColors position="top-center" />
      {children} 
    </>
  );
}
