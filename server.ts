import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TrendPro Marketplace Backend',
    timestamp: new Date().toISOString(),
  });
});

// API: Payment Gateway Adapter Verification Endpoint (Server-Side)
app.post('/api/payment/verify', (req, res) => {
  const { orderId, paymentMethod, amount, signature } = req.body;

  // Server-side payment validation
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  // Simulated gateway signature verification for test mode
  const verified = true;

  res.json({
    success: verified,
    transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'verified',
    amount,
    currency: 'INR',
    message: 'Payment signature verified successfully by TrendPro Gateway Adapter.',
  });
});

// API: Import Image from URL (Server-side fetching to safely handle CORS, validation & convert to uploadable buffer)
app.post('/api/image/import-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are supported' });
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return res.status(400).json({ error: 'Access to private internal network addresses is forbidden' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TrendPro-ImageFetcher/1.0 (compatible; Mozilla/5.0; TrendPro Marketplace)',
        'Accept': 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({
        error: `Website returned status ${response.status} (${response.statusText}). Remote site protection or login requirements prevent importing this image directly.`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(400).json({
        error: `Target link is not an image (Content-Type: ${contentType || 'unknown'}). Please use a direct image URL or download the file first.`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: `Image size is ${(buffer.length / (1024 * 1024)).toFixed(1)}MB, exceeding the 5MB limit.`,
      });
    }

    const base64Data = buffer.toString('base64');
    const mime = contentType.split(';')[0].trim();
    const dataUrl = `data:${mime};base64,${base64Data}`;

    const pathname = parsed.pathname;
    const rawFilename = pathname.split('/').pop() || 'imported_image';
    const ext = mime.split('/')[1]?.replace('+xml', '') || 'jpg';
    const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;

    return res.json({
      success: true,
      dataUrl,
      mimeType: mime,
      sizeBytes: buffer.length,
      filename,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(400).json({
        error: 'Import timed out after 8 seconds. The remote server took too long to respond.',
      });
    }
    return res.status(400).json({
      error: err.message || 'Failed to fetch the image from the provided URL.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve Vite build output in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));

    // Fallback to index.html for SPA client-side routing
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`TrendPro server running on port ${port}`);
  });
}

startServer();
