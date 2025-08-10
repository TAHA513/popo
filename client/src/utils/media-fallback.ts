// Media fallback utilities for handling missing images
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = event.currentTarget;
  const originalSrc = img.src;
  
  // Prevent infinite loops
  if (img.hasAttribute('data-fallback-attempted')) {
    console.warn('Image fallback already attempted for:', originalSrc);
    return;
  }
  
  img.setAttribute('data-fallback-attempted', 'true');
  
  // Try different fallback strategies
  if (originalSrc.includes('/api/media/')) {
    // Try direct uploads path
    const fileName = originalSrc.split('/').pop();
    const directUrl = `/uploads/${fileName}`;
    console.log('🔄 Trying direct uploads path:', directUrl);
    img.src = directUrl;
  } else if (originalSrc.includes('/uploads/')) {
    // Create a placeholder SVG
    const fileName = originalSrc.split('/').pop() || 'unknown';
    const placeholder = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#f3f4f6" stroke="#e5e7eb"/>
        <text x="150" y="140" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">صورة غير متوفرة</text>
        <text x="150" y="170" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="10">${fileName}</text>
      </svg>
    `)}`;
    
    console.log('🔄 Using placeholder for:', fileName);
    img.src = placeholder;
  }
}

export function getImageWithFallback(src: string): string {
  if (!src) {
    return createPlaceholderImage('no-image');
  }
  
  return src;
}

export function createPlaceholderImage(text: string = 'image'): string {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" fill="#f9fafb" stroke="#e5e7eb"/>
      <circle cx="150" cy="120" r="30" fill="#d1d5db"/>
      <path d="M120 160 L180 160 L170 200 L130 200 Z" fill="#d1d5db"/>
      <text x="150" y="240" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">${text}</text>
    </svg>
  `)}`;
}