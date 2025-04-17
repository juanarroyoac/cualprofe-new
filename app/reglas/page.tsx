export const metadata = {
  title: 'Reglas del Sitio - CuálProfe',
  description: 'Normativas y directrices para el uso adecuado de CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reglas del Sitio</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">EL SITIO</h2>
        <p className="mb-4">
          CuálProfe es una plataforma donde los estudiantes pueden compartir sus opiniones sobre los métodos 
          de enseñanza de los profesores y sus respectivos cursos en universidades venezolanas.
        </p>
        <p className="mb-4">
          Las calificaciones de profesores solo deben ser publicadas por usuarios que hayan tomado o estén tomando 
          actualmente una clase con el profesor. Para cada curso, los usuarios pueden publicar un solo comentario.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">CÓMO TRABAJAMOS</h2>
        <p className="mb-6">
          CuálProfe cuenta con un equipo de moderadores que revisan cada calificación enviada. Hemos definido 
          pautas del sitio para reforzar nuestra misión y garantizar que nuestras decisiones de moderación sean 
          100% consistentes. Los moderadores eliminarán cualquier comentario que no cumpla con nuestras normas.
          Si encuentras un comentario inapropiado, puedes marcarlo para revisión y será escalado a nuestros 
          moderadores inmediatamente.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">NORMAS DE USO</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">GUÍA PARA ESTUDIANTES:</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Sé honesto en tus reseñas. Queremos que confíes en estas calificaciones al evaluar tus opciones de cursos, por lo que te pedimos que contribuyas con el mismo espíritu.</li>
        <li>Cuando evalúes una clase o profesor, es útil proporcionar tanto pros como contras. Esto genera comentarios más creíbles y constructivos para tus compañeros.</li>
        <li>Las reseñas deben centrarse específicamente en el curso y tu experiencia de aprendizaje. No comentes sobre la apariencia, vestimenta, edad, género o raza del profesor.</li>
        <li>Evita rumores. Queremos que compartas tu experiencia individual y lo que aprendiste del curso. No hables en nombre de otros.</li>
        <li>Los comentarios impulsados por la ira no reflejan bien al autor. Tómate un minuto para asegurarte de que tu reseña ayudará genuinamente a otros a entender tu experiencia.</li>
        <li>CuálProfe se reserva el derecho de eliminar calificaciones que no contengan comentarios sustanciales.</li>
        <li>Solo permitimos que un estudiante califique a un profesor una vez por curso. El spam resultará en la eliminación del comentario.</li>
      </ul>
      
      <h3 className="text-xl font-medium mt-6 mb-3">CONTENIDO PROHIBIDO:</h3>
      <p className="mb-2">Los comentarios que contengan lo siguiente serán eliminados:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Blasfemias, insultos y/o vulgaridades, comentarios despectivos sobre religión, etnia o raza, género, apariencia física, edad, discapacidades mentales y/o físicas.</li>
        <li>Información identificable sobre un profesor o estudiante que permitiría a alguien contactar al profesor/estudiante fuera de su universidad.</li>
        <li>Referencias a la familia, vida personal y/o vida sexual de un profesor, incluidas insinuaciones sexuales.</li>
        <li>Afirmaciones de que un profesor muestra favoritismo por o contra un estudiante o grupo específico de estudiantes.</li>
        <li>Afirmaciones sobre la situación laboral de un profesor, incluido el empleo anterior.</li>
        <li>Afirmaciones de que un profesor o estudiante participa o ha participado en actividades ilegales.</li>
        <li>Referencias directas a otros comentarios existentes o comentarios que han sido eliminados por nuestros moderadores.</li>
        <li>Acusaciones de que el profesor se está calificando a sí mismo o a sus colegas.</li>
        <li>Enlaces y/o URLs.</li>
      </ul>
      
      <h3 className="text-xl font-medium mt-6 mb-3">GUÍA PARA PROFESORES:</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Este es un sitio anónimo donde los estudiantes pueden compartir sus experiencias en el aula. No podemos proporcionar datos o información personal sobre el remitente de una reseña.</li>
        <li>No agregamos proactivamente ningún profesor, curso o campus a nuestro sitio web, cada perfil fue enviado por nuestra comunidad estudiantil.</li>
        <li>No podemos eliminar un comentario simplemente porque sea negativo. Solo se eliminará si no cumple con las directrices de nuestro sitio.</li>
        <li>Si crees que tu perfil está siendo objeto de spam, háganoslo saber. Estamos aquí para ayudar y revisaremos con gusto los comentarios en cuestión.</li>
        <li>Aunque va contra nuestras directrices que un profesor se califique a sí mismo, recomendamos que los profesores animen a sus estudiantes a proporcionar calificaciones cada semestre. Cuantas más reseñas tengas, más representativas serán.</li>
      </ul>
      
      <h3 className="text-xl font-medium mt-6 mb-3">REPORTAR UNA CALIFICACIÓN</h3>
      <p className="mb-4">
        Si ves una calificación que crees que viola estas Directrices del Sitio, haz clic en &quot;reportar esta calificación&quot; 
        en la parte inferior del comentario e indica el problema. Dichos comentarios serán evaluados por el personal del Sitio. 
        Por favor, no reportes una calificación solo porque no estés de acuerdo con ella.
      </p>

        <p className="mt-8 text-gray-700">
          Estas reglas están diseñadas para mantener a CuálProfe como un espacio útil, respetuoso y constructivo 
          para todos los estudiantes venezolanos. Gracias por ayudarnos a mantener la calidad de nuestra plataforma.
        </p>
      </div>
    </div>
  );
}