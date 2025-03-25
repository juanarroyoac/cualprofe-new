// components/RateButton.jsx
'use client';

import { useRouter } from 'next/navigation';

export default function RateButton({ teacherId, teacherName }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/rate/${teacherId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#00248c] hover:bg-[#001e7a] text-white rounded-full px-8 py-3 text-lg font-medium"
    >
      Calificar
    </button>
  );
}