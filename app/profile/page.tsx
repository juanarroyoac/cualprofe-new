// app/profile/page.tsx
import ProfileContent from './ProfileContent';

export const metadata = {
  title: 'Mi Perfil | CuálProfe',
  description: 'Administra tu perfil en CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function ProfilePage() {
  return <ProfileContent />;
}