'use client';

import { useParams } from 'next/navigation';
import ProfessorDetailContent from './ProfessorDetailContent';

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <ProfessorDetailContent id={id} />;
}