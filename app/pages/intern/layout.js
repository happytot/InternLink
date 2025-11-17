// src/app/intern/layout.js
import InternNav from '@/components/InternNav';

export default function InternLayout({ children }) {
  return (
    <>
      <InternNav />
      <main className="intern-main">{children}</main>
    </>
  );
}
