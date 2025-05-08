import { normalizeText } from './textNormalization';

// Función para calcular la distancia de Levenshtein
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

export function getSuggestions(input: string, options: string[]): string[] {
  const normalizedInput = normalizeText(input);
  
  // 1. Coincidencias exactas
  const exactMatches = options.filter(opt => 
    normalizeText(opt) === normalizedInput
  );
  
  // 2. Coincidencias que empiezan con el input
  const startsWithMatches = options.filter(opt => 
    normalizeText(opt).startsWith(normalizedInput)
  );
  
  // 3. Coincidencias que contienen el input
  const containsMatches = options.filter(opt => 
    normalizeText(opt).includes(normalizedInput)
  );
  
  // 4. Coincidencias por similitud (usando Levenshtein distance)
  const similarityMatches = options.filter(opt => {
    const distance = levenshteinDistance(normalizeText(opt), normalizedInput);
    return distance <= 2; // Permitir hasta 2 caracteres de diferencia
  });
  
  // Combinar y eliminar duplicados
  return [...new Set([
    ...exactMatches,
    ...startsWithMatches,
    ...containsMatches,
    ...similarityMatches
  ])];
}

export function filterTeachers(teachers: any[], searchQuery: string) {
  const normalizedQuery = normalizeText(searchQuery);
  
  // 1. Búsqueda exacta
  let results = teachers.filter(teacher => 
    normalizeText(teacher.name) === normalizedQuery ||
    normalizeText(teacher.university) === normalizedQuery ||
    normalizeText(teacher.department) === normalizedQuery
  );
  
  // 2. Búsqueda por coincidencia parcial
  if (results.length === 0) {
    results = teachers.filter(teacher => 
      normalizeText(teacher.name).includes(normalizedQuery) ||
      normalizeText(teacher.university).includes(normalizedQuery) ||
      normalizeText(teacher.department).includes(normalizedQuery)
    );
  }
  
  // 3. Búsqueda por similitud
  if (results.length === 0) {
    results = teachers.filter(teacher => {
      const nameDistance = levenshteinDistance(normalizeText(teacher.name), normalizedQuery);
      const universityDistance = levenshteinDistance(normalizeText(teacher.university), normalizedQuery);
      const departmentDistance = levenshteinDistance(normalizeText(teacher.department), normalizedQuery);
      
      return nameDistance <= 2 || universityDistance <= 2 || departmentDistance <= 2;
    });
  }
  
  return results;
} 