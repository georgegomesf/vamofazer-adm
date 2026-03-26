export function getAttachmentTypeFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;

    if (host === 'youtube.com' || host === 'youtu.be') {
      if (path.includes('/watch') || host === 'youtu.be' || path.startsWith('/shorts/')) {
        return 'Vídeo do Youtube';
      }
      if (path.includes('/channel/') || path.includes('/c/') || path.startsWith('/@')) {
        return 'Canal do Youtube';
      }
    }

    if (host === 'instagram.com') {
      if (path.startsWith('/p/') || path.startsWith('/reels/') || path.startsWith('/tv/')) {
        return 'Post do Instagram';
      }
      return 'Perfil do Instagram';
    }

    if (host === 'docs.google.com' && path.startsWith('/forms/')) {
      return 'Formulário Google';
    }

    if (host === 'drive.google.com' || host === 'docs.google.com') {
      if (path.includes('/drive/folders/')) {
        return 'Pasta do Google Drive';
      }
      return 'Arquivo do Google Drive';
    }

    if (path.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?')) {
      return 'Arquivo PDF';
    }
  } catch (e) {
    // If not a valid URL, fallback to simple string check
  }

  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com/watch') || urlLower.includes('youtu.be/') || urlLower.includes('youtube.com/shorts/')) {
    return 'Vídeo do Youtube';
  }
  if (urlLower.includes('youtube.com/channel/') || urlLower.includes('youtube.com/c/') || urlLower.includes('youtube.com/@')) {
    return 'Canal do Youtube';
  }
  if (urlLower.includes('instagram.com/p/') || urlLower.includes('instagram.com/reels/')) {
    return 'Post do Instagram';
  }
  if (urlLower.includes('instagram.com/')) {
    return 'Perfil do Instagram';
  }
  if (urlLower.includes('docs.google.com/forms/')) {
    return 'Formulário Google';
  }
  if (urlLower.includes('drive.google.com') && urlLower.includes('folders')) {
    return 'Pasta do Google Drive';
  }
  if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
    return 'Arquivo do Google Drive';
  }
  if (urlLower.endsWith('.pdf') || urlLower.includes('.pdf?')) {
    return 'Arquivo PDF';
  }

  return 'Link';
}
