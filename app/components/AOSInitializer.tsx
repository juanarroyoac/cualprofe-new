// app/components/AOSInitializer.tsx
'use client'; // This component needs to be a client component

import { useEffect } from 'react';
import AOS from 'aos';

export default function AOSInitializer() {
  useEffect(() => {
    AOS.init({
      duration: 800, // Animation duration
      once: true,    // Animate elements only once
      offset: 50,    // Offset (in px) from the original trigger point
      // delay: 100, // Default delay
      // easing: 'ease-in-out', // Default easing
      // disable: 'mobile' // Optionally disable AOS on mobile
    });
  }, []); // Run only once on mount

  return null; // This component doesn't render anything
}