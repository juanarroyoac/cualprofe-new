'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AddProfessorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    department: '',
    courses: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name || !formData.university || !formData.department) {
        throw new Error('Por favor, complete todos los campos requeridos.');
      }

      // Create submission object
      const submission = {
        ...formData,
        courses: formData.courses.split(',').map(course => course.trim()),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Add to professorSubmissions collection
      await addDoc(collection(db, 'professorSubmissions'), submission);
      
      // Show success message
      setSuccessMessage('¡Gracias! Tu solicitud ha sido enviada y será revisada pronto.');
      
      // Reset form
      setFormData({
        name: '',
        university: '',
        department: '',
        courses: ''
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting professor:', err);
      setError(err.message || 'Ocurrió un error al enviar el formulario. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agregar un Nuevo Profesor</h1>
      
      {successMessage ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      ) : (
        <>
          <p className="mb-6 text-gray-600">
            ¿No encuentras al profesor que buscas? Completa este formulario para agregarlo a nuestra base de datos.
            Nuestro equipo revisará la solicitud lo antes posible.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo del profesor *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F17FF]"
                placeholder="Ej. Juan Pérez Rodríguez"
                required
              />
            </div>
            
            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                Universidad *
              </label>
              <select
                id="university"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F17FF]"
                required
              >
                <option value="">Seleccionar universidad</option>
                <option value="Universidad Católica Andrés Bello">Universidad Católica Andrés Bello</option>
                <option value="Universidad Metropolitana">Universidad Metropolitana</option>
                {/* Add more universities as needed */}
              </select>
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Facultad / Departamento *
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F17FF]"
                placeholder="Ej. Ingeniería, Economía, Ciencias Sociales"
                required
              />
            </div>
            
            <div>
              <label htmlFor="courses" className="block text-sm font-medium text-gray-700 mb-1">
                Materias que enseña (separa con comas)
              </label>
              <textarea
                id="courses"
                name="courses"
                value={formData.courses}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F17FF]"
                placeholder="Ej. Cálculo I, Estadística, Macroeconomía"
                rows="3"
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0F17FF] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}