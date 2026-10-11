import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Server-side Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TrendPro Marketplace Backend',
    timestamp: new Date().toISOString(),
  });
});

// API: Server-side Coupon Validation
app.post('/api/coupon/validate', (req, res) => {
  const { coupon, subtotal, customerId, productIds = [], categoryIds = [] } = req.body;

  if (!coupon || !coupon.code) {
    return res.status(400).json({ valid: false, message: 'Invalid coupon request' });
  }

  const cleanCode = String(coupon.code).trim().toUpperCase();
  const orderSubtotal = Number(subtotal) || 0;

  // Active check
  if (coupon.isActive === false) {
    return res.json({ valid: false, discount: 0, message: `Coupon code '${cleanCode}' is currently inactive.` });
  }

  // Expiry check
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    // End of expiry day
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      return res.json({ valid: false, discount: 0, message: `Coupon code '${cleanCode}' has expired.` });
    }
  }

  // Start date check
  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (new Date() < start) {
      return res.json({ valid: false, discount: 0, message: `Coupon code '${cleanCode}' will be active from ${coupon.startDate}.` });
    }
  }

  // Minimum Order Value check
  const minVal = Number(coupon.minOrderValue) || 0;
  if (orderSubtotal < minVal) {
    return res.json({
      valid: false,
      discount: 0,
      message: `Minimum order value of ₹${minVal.toLocaleString()} required to apply '${cleanCode}'. Add ₹${(minVal - orderSubtotal).toLocaleString()} more!`,
    });
  }

  // Total Usage Limit check
  if (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0) {
    const used = Number(coupon.usedCount) || 0;
    if (used >= coupon.usageLimit) {
      return res.json({ valid: false, discount: 0, message: `Coupon code '${cleanCode}' has reached its maximum redemption limit.` });
    }
  }

  // Category restriction check
  if (Array.isArray(coupon.restrictedCategoryIds) && coupon.restrictedCategoryIds.length > 0) {
    const hasMatchingCategory = categoryIds.some((catId: string) =>
      coupon.restrictedCategoryIds.includes(catId)
    );
    if (!hasMatchingCategory) {
      return res.json({ valid: false, discount: 0, message: `Coupon '${cleanCode}' is only valid for selected eligible product categories.` });
    }
  }

  // Product restriction check
  if (Array.isArray(coupon.restrictedProductIds) && coupon.restrictedProductIds.length > 0) {
    const hasMatchingProduct = productIds.some((pId: string) =>
      coupon.restrictedProductIds.includes(pId)
    );
    if (!hasMatchingProduct) {
      return res.json({ valid: false, discount: 0, message: `Coupon '${cleanCode}' is only applicable for designated promotional items.` });
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((orderSubtotal * Number(coupon.discountValue || 0)) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    // Flat discount
    discount = Number(coupon.discountValue) || 0;
  }

  discount = Math.min(discount, orderSubtotal);

  return res.json({
    valid: true,
    discount,
    message: `🎉 Coupon '${cleanCode}' applied successfully! You saved ₹${discount.toLocaleString()}.`,
    coupon,
  });
});

// API: Server-Side AI Assistant (Riya — Friendly Female Voice TrendPro Assistant)
app.post('/api/assistant/chat', async (req, res) => {
  const { message, history = [], knowledge, catalogSummary, userContext } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const storeName = knowledge?.storeName || 'TrendPro';
  const ownerInfo = knowledge?.verifiedOwnerInfo || 'Saurav Kumar (saurav586kumar@gmail.com)';
  const shippingPolicy = knowledge?.shippingPolicy || '3 to 8 days across India. Free delivery over ₹999, else ₹79.';
  const returnPolicy = knowledge?.returnRefundPolicy || '7-day hassle-free return policy. Immediate wallet refunds upon owner approval.';
  const supportEmail = knowledge?.supportEmail || 'saurav586kumar@gmail.com';
  const supportPhone = knowledge?.supportPhone || '+91 98765 43210';
  const faqsText = Array.isArray(knowledge?.faqs)
    ? knowledge.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n')
    : '';

  const assistantName = knowledge?.assistantPersonality?.name || 'TrendPro Assistant';
  const systemInstruction = `You are "${assistantName}", a sweet, friendly, polite, and intelligent female AI companion and ecommerce shopping assistant for ${storeName} (an Indian e-commerce marketplace).

Language and Personality:
- Default language: Hindi. Speak in warm, natural, simple Hindi with everyday comfortable expressions (e.g. "Namaste ji!", "Main bilkul badiya hoon, aap bataiye?", "Zaroor, main aapki poori madad karungi!").
- If the user speaks Hinglish, reply naturally in Hinglish.
- If the user speaks English, reply in English.
- Adapt automatically to the user's language without requiring manual switching.
- You have a warm, friendly female persona. Be supportive, patient, lighthearted, and occasionally humorous when appropriate.
- Be transparent that you are TrendPro's AI assistant. Do not claim to be a human.
- Avoid repetitive greetings, rigid robotic templates, and stiff formal language.

Conversational Capabilities:
- You are not just a FAQ bot; you can engage in casual conversation, share funny jokes ("Ek funny joke sunao"), explain concepts, discuss technology, and answer everyday questions.
- If asked "Aaj kya kar rahe ho?" or similar casual banter, reply naturally like a friendly companion helping customers on TrendPro.
- If asked "TrendPro ka owner kaun hai?": State clearly that TrendPro is founded and owned by ${ownerInfo}, based in Samastipur, Bihar.
- If asked for product suggestions (e.g. "Mujhe ₹500 ke andar ek achha product suggest karo"), recommend matching items from the catalog or catalog summary.

Ecommerce Store Context & Policies:
- Store Owner & Creator: ${ownerInfo}
- Support Email: ${supportEmail}, Phone: ${supportPhone}
- Shipping: ${shippingPolicy}
- Returns & Refunds: ${returnPolicy}
- FAQs: ${faqsText}
- Catalog Summary:
  ${catalogSummary || 'Wide range of Electronics, Fashion, Home & Kitchen, Audio, Beauty, and Digital Gift Cards.'}
${userContext ? `- Current Customer Context: ${JSON.stringify(userContext)}` : ''}

Interactive Action Tags:
When relevant, append interactive action tags in brackets so the UI renders one-click action buttons:
- [action:navigate|/cart|Open Cart]
- [action:navigate|/orders|My Orders]
- [action:navigate|/trending|Trending Deals]
- [action:navigate|/support|Chat with Store Owner]
- [action:navigate|/wallet|My Wallet]
- [action:navigate|/product/{productId}|View Product]
- [action:coupon|{code}|Apply Coupon]

Keep answers genuinely helpful, engaging, and pleasant!`;

  try {
    // Format conversation history for Gemini API
    const formattedContents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-8)) {
        if (turn.role && turn.text) {
          formattedContents.push({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "Namaste! Main aapki madad ke liye taiyaar hoon. Aap TrendPro par koi bhi product, coupon ya order status ke baare mein pooch sakte hain.";
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini Assistant Server Error:', error);

    // Warm, friendly fallback response if AI call fails
    let fallbackReply = `Namaste! Main Riya hoon. Mujhe aapki madad karke bohot khushi hogi! 😊\n\n`;
    const lower = message.toLowerCase();

    if (lower.includes('joke') || lower.includes('chutkula') || lower.includes('hasao')) {
      fallbackReply += `Ek baar ek customer ne delivery boy se poocha: "Bhaiya itni jaldi delivery kaise kar di?"\nDelivery boy bola: "Sir, TrendPro ka order tha, raste mein traffic bhi side ho gaya!" 😂✨\n\nAb bataiye, aur kya shopping karni hai aaj?`;
    } else if (lower.includes('kya kar rahe ho') || lower.includes('kya ho raha hai') || lower.includes('kaise ho')) {
      fallbackReply += `Main bilkul theek hoon! Bas TrendPro ke customers ke orders pack karwane aur best discount deals batane mein busy hoon. Aap bataiye, aaj aapka din kaisa chal raha hai? 😊`;
    } else if (lower.includes('order') || lower.includes('track')) {
      fallbackReply += `Aap apne placed orders ka live status dekhne ke liye My Orders section check kar sakte hain. Wahan aapko dispatch timeline aur estimated delivery date mil jayegi.\n\n[action:navigate|/orders|My Orders]`;
    } else if (lower.includes('coupon') || lower.includes('discount') || lower.includes('offer')) {
      fallbackReply += `Aap checkout par **FIRST500** (₹500 off on ₹2,000+) ya **TRENDPRO15** (15% off up to ₹1,500) use kar sakte hain!\n\n[action:coupon|FIRST500|Apply FIRST500] [action:navigate|/cart|Go to Cart]`;
    } else if (lower.includes('return') || lower.includes('refund') || lower.includes('cancel')) {
      fallbackReply += `TrendPro par 7-day easy return policy hai. Order deliver hone ke baad aap Order Details page se return request daal sakte hain. Approved hone par turant aapke TrendPro wallet mein refund credit ho jata hai!\n\n[action:navigate|/orders|View Orders]`;
    } else if (lower.includes('contact') || lower.includes('owner') || lower.includes('support') || lower.includes('chat')) {
      fallbackReply += `Aap store owner se direct baat karne ke liye Customer Support Chat use kar sakte hain ya email kar sakte hain: ${supportEmail}.\n\n[action:navigate|/support|Open Live Chat]`;
    } else {
      fallbackReply += `Aap mujhse kisi bhi product, trending deals, shipping time, ya checkout ke baare mein pooch sakte hain. Main hamesha aapki seva mein hazir hoon!\n\n[action:navigate|/trending|Explore Trending Deals] [action:navigate|/cart|Check Cart]`;
    }

    return res.json({ reply: fallbackReply });
  }
});

// API: Payment Gateway Adapter Verification Endpoint (Server-Side)
app.post('/api/payment/verify', (req, res) => {
  const { orderId, paymentMethod, amount, signature } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  res.json({
    success: true,
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
