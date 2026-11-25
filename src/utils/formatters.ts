export const formatARS = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Valida DNI (7 u 8 dígitos) o CUIT/CUIL (11 dígitos con o sin guiones)
export const isValidDniOrCuit = (value: string): boolean => {
  const clean = value.replace(/[-\s.]/g, '');
  return /^\d{7,8}$/.test(clean) || /^\d{11}$/.test(clean);
};

// Valida Código Postal Argentino tradicional (4 dígitos, ej: 1417) o CPA (ej: C1417ABC)
export const isValidPostalCodeAR = (value: string): boolean => {
  const clean = value.trim().toUpperCase();
  return /^\d{4}$/.test(clean) || /^[A-Z]\d{4}[A-Z]{3}$/.test(clean);
};

export const ARGENTINA_PROVINCES = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];
