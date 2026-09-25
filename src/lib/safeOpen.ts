/**
 * Safe External URL Opener
 * Prevents iframe / popup-blocker restrictions from stopping button actions.
 */
export function safeOpenUrl(url: string, target = '_blank'): void {
  if (!url) return;
  try {
    // Attempt normal window.open
    const newWindow = window.open(url, target, 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback to programmatic <a> element click
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = target;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  } catch {
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = target;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      window.location.assign(url);
    }
  }
}
