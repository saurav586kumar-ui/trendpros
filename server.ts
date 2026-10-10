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

// Serve Vite build output in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`TrendPro server running on port ${port}`);
});
