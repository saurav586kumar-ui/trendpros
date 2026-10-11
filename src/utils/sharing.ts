/**
 * Unified Share Helper with Web Share API and Clipboard Fallback
 */

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard';
  message: string;
}

export async function shareProduct(product: { id: string; name: string; slug?: string }): Promise<ShareResult> {
  const slugOrId = product.slug ? `${product.slug}-${product.id}` : product.id;
  const canonicalUrl = `${window.location.origin}/product/${slugOrId}`;
  const title = product.name;
  const text = `Check out "${product.name}" on TrendPro!`;

  return executeShare(title, text, canonicalUrl);
}

export async function shareCategory(category: { slug: string; name: string }): Promise<ShareResult> {
  const canonicalUrl = `${window.location.origin}/category/${category.slug}`;
  const title = `${category.name} on TrendPro`;
  const text = `Browse ${category.name} collection on TrendPro!`;

  return executeShare(title, text, canonicalUrl);
}

export async function shareTrending(): Promise<ShareResult> {
  const canonicalUrl = `${window.location.origin}/trending`;
  const title = `Trending Deals on TrendPro`;
  const text = `Check out the hottest trending products right now on TrendPro!`;

  return executeShare(title, text, canonicalUrl);
}

async function executeShare(title: string, text: string, url: string): Promise<ShareResult> {
  // Try Web Share API if available (typically mobile browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully!',
      };
    } catch (err: any) {
      // User cancelled share dialog
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'native',
          message: 'Share cancelled',
        };
      }
      // Otherwise fall through to clipboard fallback
      console.warn('Web Share API error, falling back to clipboard:', err);
    }
  }

  // Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return {
        success: true,
        method: 'clipboard',
        message: 'Link copied to clipboard!',
      };
    } catch (clipErr) {
      console.warn('Clipboard writeText failed:', clipErr);
    }
  }

  // Legacy fallback
  try {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return {
      success: true,
      method: 'clipboard',
      message: 'Link copied to clipboard!',
    };
  } catch (legacyErr) {
    return {
      success: false,
      method: 'clipboard',
      message: `Failed to copy link. Please copy URL: ${url}`,
    };
  }
}
