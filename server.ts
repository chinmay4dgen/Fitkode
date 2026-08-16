import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Razorpay SDK instance
let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Razorpay Config status endpoint (returns public Key ID if configured in env)
  app.get('/api/razorpay/config', (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const isConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    res.json({
      keyId,
      isConfigured,
      currency: 'INR'
    });
  });

  // Create Razorpay Order endpoint
  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const { planId, planName, amount, customerInfo } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid plan amount specified.' });
      }

      const rzp = getRazorpay();
      if (!rzp) {
        return res.status(503).json({
          error: 'Razorpay keys not configured on server.',
          hint: 'Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings > Secrets or .env'
        });
      }

      const amountInPaise = Math.round(Number(amount) * 100);
      const receiptId = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          planId: planId || '',
          planName: planName || '',
          customerName: customerInfo?.name || '',
          customerEmail: customerInfo?.email || '',
          customerPhone: customerInfo?.phone || '',
        }
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (err: any) {
      console.error('Error creating Razorpay order:', err);
      return res.status(500).json({
        error: err.message || 'Failed to create Razorpay order',
        details: err
      });
    }
  });

  // Verify Razorpay Payment Signature endpoint
  app.post('/api/razorpay/verify-payment', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, customerInfo } = req.body;

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return res.status(503).json({
          error: 'RAZORPAY_KEY_SECRET is not configured on server.'
        });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          error: 'Missing payment signature verification parameters.'
        });
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        console.log(`[Payment Verified] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}, Customer: ${customerInfo?.email || 'N/A'}`);
        return res.json({
          success: true,
          message: 'Payment verified successfully',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          planName
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid signature. Payment verification failed.'
        });
      }
    } catch (err: any) {
      console.error('Error verifying payment signature:', err);
      return res.status(500).json({
        error: err.message || 'Internal error verifying payment'
      });
    }
  });

  // Vite development middleware or production static asset server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
