export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Mapa de abreviaturas comunes
export const COMMON_ABBREVIATIONS: Record<string, string> = {
  'ing': 'ingeniería',
  'eco': 'economía',
  'adm': 'administración',
  'ucab': 'universidad católica andrés bello',
  'unimet': 'universidad metropolitana',
  'usb': 'universidad simón bolívar',
  'ucv': 'universidad central de venezuela',
  'uneg': 'universidad de oriente',
  'ula': 'universidad de los andes',
  'unefa': 'universidad nacional experimental de la fuerza armada',
};

// Mapa de correcciones comunes
export const COMMON_CORRECTIONS: Record<string, string> = {
  'ingenieria': 'ingeniería',
  'economia': 'economía',
  'administracion': 'administración',
  'matematicas': 'matemáticas',
  'fisica': 'física',
  'quimica': 'química',
  'electronica': 'electrónica',
  'computacion': 'computación',
  'programacion': 'programación',
  'estadistica': 'estadística',
};

// Función para aplicar correcciones comunes
export function applyCommonCorrections(text: string): string {
  const normalized = normalizeText(text);
  return COMMON_CORRECTIONS[normalized] || text;
}

// Función para expandir abreviaturas comunes
export function expandAbbreviations(text: string): string {
  const normalized = normalizeText(text);
  return COMMON_ABBREVIATIONS[normalized] || text;
} 