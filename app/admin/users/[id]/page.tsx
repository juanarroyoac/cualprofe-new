// app/admin/users/[id]/page.tsx
import { Metadata } from 'next';
import UserDetailContent from './UserDetailContent';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Usuario ID: ${id} | Panel de Administración`,
  };
}

export default async function UserPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <UserDetailContent id={id} />;
}