'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AddProfessorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    department: '',
    courses: ''
  });
  const [universities, setUniversities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch active universities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setIsLoading(true);
        
        // First get all unique universities from teachers
        const teachersQuery = query(collection(db, 'teachers'), orderBy('university'));
        const teachersSnapshot = await getDocs(teachersQuery);
        
        // Create a map to track unique universities
        const universitiesMap = new Map();
        
        // Process teachers to get unique universities
        teachersSnapshot.forEach(doc => {
          const teacherData = doc.data();
          const universityName = teacherData.university;
          
          if (universityName && !universitiesMap.has(universityName)) {
            universitiesMap.set(universityName, {
              name: universityName,
              isActive: true // Default to active
            });
          }
        });
        
        // Check university settings to filter only active ones
        for (const [name, university] of universitiesMap.entries()) {
          const settingDoc = await getDoc(doc(db, 'universitySettings', name));
          if (settingDoc.exists()) {
            const settingData = settingDoc.data();
            university.isActive = settingData.isActive !== false; // Default to true if not set
          }
        }
        
        // Convert map to array, filtering for active only
        const universitiesList = Array.from(universitiesMap.values())
          .filter(uni => uni.isActive)
          .map(uni => uni.name)
          .sort((a, b) => a.localeCompare(b, 'es'));
        
        setUniversities(universitiesList);
      } catch (error) {
        console.error('Error fetching universities:', error);
        setError('Error al cargar las universidades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniversities();
  }, []);

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
        courses: formData.courses.split(',').map(course => course.trim()).filter(course => course),
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
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 font-poppins text-[#00103f]">Agregar un Nuevo Profesor</h1>
        
        {successMessage ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-5 rounded-xl mb-4 shadow-sm">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium font-roboto">{successMessage}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 p-5 bg-blue-50 rounded-xl">
              <p className="text-[#00103f] font-roboto">
                ¿No encuentras al profesor que buscas? Completa este formulario para agregarlo a nuestra base de datos.
                Nuestro equipo revisará la solicitud lo antes posible.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-roboto">{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  Nombre completo del profesor <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-[#00103f] transition-colors font-roboto"
                  placeholder="Ej. Juan Pérez Rodríguez"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  Universidad <span className="text-red-600">*</span>
                </label>
                {isLoading ? (
                  <div className="flex items-center space-x-2 h-12 px-4">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-roboto">Cargando universidades...</span>
                  </div>
                ) : (
                  <select
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-[#00103f] transition-colors font-roboto bg-white"
                    required
                  >
                    <option value="">Seleccionar universidad</option>
                    {universities.map(university => (
                      <option key={university} value={university}>
                        {university}
                      </option>
                    ))}
                    <option value="otra">Otra (no en la lista)</option>
                  </select>
                )}
              </div>
              
              {formData.university === 'otra' && (
                <div>
                  <label htmlFor="customUniversity" className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                    Nombre de la universidad <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="customUniversity"
                    name="customUniversity"
                    onChange={(e) => setFormData(prev => ({...prev, university: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-[#00103f] transition-colors font-roboto"
                    placeholder="Ej. Universidad Simón Bolívar"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  Facultad / Departamento <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-[#00103f] transition-colors font-roboto"
                  placeholder="Ej. Ingeniería, Economía, Ciencias Sociales"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="courses" className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  Materias que enseña (separa con comas)
                </label>
                <textarea
                  id="courses"
                  name="courses"
                  value={formData.courses}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-[#00103f] transition-colors font-roboto"
                  placeholder="Ej. Cálculo I, Estadística, Macroeconomía"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-2 font-roboto">
                  Si no conoces todas las materias, puedes indicar las que sepas.
                </p>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#00103f] text-white py-3 px-6 rounded-full hover:bg-[#001b6d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:ring-offset-2 disabled:opacity-50 shadow-md font-medium text-base ${isSubmitting ? 'cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </div>
                  ) : 'Enviar Solicitud'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 font-roboto">
                  Al enviar este formulario aceptas nuestros <a href="/terminosycondiciones" className="text-[#00103f] hover:underline transition-colors">Términos y Condiciones</a>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}