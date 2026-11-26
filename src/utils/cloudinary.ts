export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Faltan configurar las variables de Cloudinary.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado debe ser una imagen.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // Construimos la URL por partes para evitar recortes al copiar/pegar
  const endpoint = ['https://', 'api.', 'cloudinary.com', `/v1_1/${cloudName}/image/upload`].join('');

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al subir la imagen a Cloudinary.');
  }

  const data = await response.json();
  return data.secure_url as string;
}

export function getOptimizedImageUrl(
  url?: string,
  width = 500,
  height = 500,
  mode: 'fill' | 'pad' = 'pad'
): string {
  if (!url) return 'https://placehold.co';
  if (!url.includes('/upload/')) return url;

  const transform =
    mode === 'pad'
      ? `c_pad,b_white,w_${width},h_${height},f_auto,q_auto`
      : `c_fill,g_auto,w_${width},h_${height},f_auto,q_auto`;

  return url.replace('/upload/', `/upload/${transform}/`);
}