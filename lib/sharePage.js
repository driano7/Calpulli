// Compartir la página actual decidiendo SOLO por capacidad del navegador,
// nunca por user-agent ni por detección táctil (en iPad y tablets Android la
// hoja nativa existe aunque el UA se disfrace de escritorio; donde no existe,
// el fallback es copiar el enlace). Lo usan ShareJourneyBlock (cierre de
// posts) y ShareJourneyButton (flotante de journeys).
//
// Devuelve: 'shared' | 'copied' | 'cancelled' | 'error'

export async function sharePageOrCopy({ title, text, url }) {
  const shareData = { title, text, url }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const canShare = typeof navigator.canShare !== 'function' || navigator.canShare(shareData)
    if (canShare) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch {
        // El usuario cerró la hoja de compartir: no es un error.
        return 'cancelled'
      }
    }
  }

  // Sin Web Share API: copiar el enlace al portapapeles.
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    document.body.removeChild(textarea)
    return ok ? 'copied' : 'error'
  }
}
