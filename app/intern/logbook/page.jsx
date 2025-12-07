// app/intern/logbook/page.jsx
'use client'; // This page is now a client component, which is fine
import LogbookClient from '../../components/intern/LogbookClient';
import InternNav from '../../components/InternNav';



// This is now a simple component that just renders the client component
export default function LogbookPage() {
  return (
    <>
  
      <InternNav />
      <LogbookClient />
    </>
  );
}