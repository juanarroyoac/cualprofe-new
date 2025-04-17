export const metadata = {
  title: 'Ayuda | CuálProfe',
  description: 'Centro de ayuda de CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ayuda</h1>
      
      <div className="prose max-w-none">
        {/* We'll fill this with content later */}
        <p>Preguntas frecuentes y ayuda sobre CuálProfe...</p>
      </div>
    </div>
  );
}