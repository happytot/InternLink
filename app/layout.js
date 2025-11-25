import './globals.css';
import './index.css';
import LayoutWrapper from './components/LayoutWrapper';
import { Providers } from './providers';

export const metadata = {
  title: 'Internship Portal',
  description: 'A platform connecting interns and companies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Providers must wrap the content so the theme is available everywhere */}
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}