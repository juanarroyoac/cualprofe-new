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
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
    >
      Calificar
    </button>
  );
}