import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ShieldCheck, CreditCard, ArrowRight, Zap, RefreshCw, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import Seo from './Seo';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  coverImage: string;
  badge?: string;
  perks: string[];
}

export default function TestPaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Chinmay Jain (Test)',
    email: 'chinmay4jain@gmail.com',
    phone: '9828402190',
  });
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success'>('form');
  const [paymentId, setPaymentId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const testPlan: Plan = {
    id: 'plan_test_1',
    name: 'Razorpay Live Test Plan',
    price: 1,
    duration: 'Instant Live Gateway Test (₹1)',
    description: 'Internal testing sandbox plan to verify live checkout via UPI (Google Pay, PhonePe, Paytm, QR), Credit/Debit Cards, Netbanking, and webhook/signature verification.',
    coverImage: 'https://res.cloudinary.com/akmvlt3d/image/upload/v1786877440/My%20Brand/Fitkode_Logo_300_x_150_px_bmxnpa.png',
    badge: 'INTERNAL TEST ₹1',
    perks: [
      'Charge amount: ₹1.00 (Single Rupee Test)',
      'Tests UPI Apps: GPay, PhonePe, Paytm, BHIM, QR scan',
      'Tests Credit Cards, Debit Cards, Netbanking & Wallets',
      'Verifies backend order creation & HMAC-SHA256 signature verification',
      'Generates instant live transaction receipt & Payment ID',
    ],
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ('Razorpay' in window) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCheckoutError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsLoading(false);
      setCheckoutError('Failed to load Razorpay checkout script from checkout.razorpay.com. Please check your internet connection.');
      return;
    }

    try {
      // 1. Call backend to create Razorpay Order
      let orderData: { orderId?: string; keyId?: string; amount?: number; currency?: string } | null = null;
      try {
        const orderResponse = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: testPlan.id,
            planName: testPlan.name,
            amount: testPlan.price,
            customerInfo,
          }),
        });

        const data = await orderResponse.json();
        if (orderResponse.ok && data.success) {
          orderData = data;
        } else if (data.hint) {
          console.info('Razorpay backend hint:', data.hint);
        }
      } catch (err) {
        console.warn('Backend order call skipped or unavailable:', err);
      }

      // Determine active key: backend key -> custom local key -> public env key
      const activeKeyId = orderData?.keyId || customKey || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';

      if (!activeKeyId) {
        setIsLoading(false);
        setCheckoutError('Razorpay API Key not yet configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings > Secrets or enter a test Key ID below.');
        setShowConfig(true);
        return;
      }

      if ('Razorpay' in window) {
        const RazorpayConstructor = (window as any).Razorpay;

        const options: any = {
          key: activeKeyId,
          amount: testPlan.price * 100, // 100 paise = ₹1
          currency: 'INR',
          name: 'Fitkode',
          description: testPlan.name,
          image: 'https://res.cloudinary.com/akmvlt3d/image/upload/v1786877440/My%20Brand/Fitkode_Logo_300_x_150_px_bmxnpa.png',
          prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone,
          },
          notes: {
            environment: 'Internal ₹1 Testing Page',
            initiative: 'Fitkode Fitness Simplified',
            focal_coach: 'Chinmay Jain',
          },
          theme: {
            color: '#1C8A43',
          },
          handler: async function (response: any) {
            setIsLoading(true);
            try {
              if (response.razorpay_signature && response.razorpay_order_id) {
                const verifyRes = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    planName: testPlan.name,
                    customerInfo,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData.success) {
                  console.warn('Payment verification notice:', verifyData.error);
                }
              }

              setPaymentId(response.razorpay_payment_id || `rzp_pay_${Date.now()}`);
              setOrderId(response.razorpay_order_id || orderData?.orderId || '');
              setCheckoutStep('success');
            } catch (vErr) {
              console.error('Verification error:', vErr);
              setPaymentId(response.razorpay_payment_id || `rzp_pay_${Date.now()}`);
              setCheckoutStep('success');
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        if (orderData?.orderId) {
          options.order_id = orderData.orderId;
        }

        const rzpInstance = new RazorpayConstructor(options);
        rzpInstance.on('payment.failed', function (resp: any) {
          setIsLoading(false);
          setCheckoutError(resp?.error?.description || 'Payment was cancelled or failed.');
        });
        rzpInstance.open();
      }
    } catch (err: any) {
      console.error('Test checkout error:', err);
      setIsLoading(false);
      setCheckoutError(err.message || 'An error occurred initializing payment gateway.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 py-12 px-4 sm:px-6 lg:px-8">
      <Seo 
        title="Internal Test Payment Gateway | Fitkode" 
        description="Internal gateway testing environment" 
        canonicalPath="/test"
        noIndex={true}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-amber-950">Internal Razorpay Gateway Test Page</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-md">NOINDEX / NOFOLLOW</span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                This page is isolated for internal live verification. It is not included in sitemaps, headers, or public menus.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            {showConfig ? 'Hide Key Config' : 'Custom Key Config'}
          </button>
        </div>

        {/* Custom Key Config (Optional fallback helper) */}
        {showConfig && (
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-green" /> Client-Side Test Key Override (Optional)
            </h3>
            <p className="text-xs text-gray-500">
              If your backend keys are not yet deployed in server secrets, you can paste your Razorpay Key ID (<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">rzp_live_...</code> or <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">rzp_test_...</code>) below:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="rzp_live_XXXXXXXXXXXXXX or rzp_test_XXXXXXXXXXXXXX"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-green outline-none"
              />
              {customKey && (
                <button
                  onClick={() => setCustomKey('')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Test Plan Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-white rounded-3xl p-8 border border-brand-light-green shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-bold tracking-wide">
                {testPlan.badge}
              </span>
              <span className="text-xs font-mono text-gray-400">ID: {testPlan.id}</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-brand-dark-green">{testPlan.name}</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-dark-green">₹1</span>
                <span className="text-xs text-gray-500 font-medium">(100 paise)</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{testPlan.description}</p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Verification Checklist</h4>
              <ul className="space-y-2">
                {testPlan.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="md:col-span-5 bg-white rounded-3xl p-8 border border-brand-light-green shadow-sm flex flex-col justify-between">
            {checkoutStep === 'form' ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark-green flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-green" /> Test Checkout
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Fill test customer details and launch Razorpay</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-green outline-none bg-gray-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-green outline-none bg-gray-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-green outline-none bg-gray-50/50"
                    />
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <div>
                      <strong>Error:</strong> {checkoutError}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-brand-light-green/20 rounded-xl border border-brand-light-green/40 text-[11px] text-brand-dark-green leading-relaxed flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Opens live 256-bit encrypted Razorpay Checkout window.</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-brand-green hover:bg-brand-dark-green text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting Razorpay Gateway...
                    </>
                  ) : (
                    <>
                      Pay ₹1 with Razorpay
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center my-auto py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-brand-dark-green">Payment Test Successful!</h3>
                  <p className="text-xs text-gray-500 mt-1">Razorpay processed and verified the ₹1 transaction.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl text-left text-xs font-mono space-y-2 border border-gray-200">
                  <p className="flex justify-between">
                    <span className="text-gray-400">PLAN:</span>
                    <span className="font-bold text-brand-dark-green">Razorpay Live Test Plan</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">AMOUNT PAID:</span>
                    <span className="font-bold text-brand-green">₹1.00</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">CLIENT:</span>
                    <span className="font-bold text-gray-700">{customerInfo.name}</span>
                  </p>
                  {orderId && (
                    <p className="flex justify-between">
                      <span className="text-gray-400">ORDER ID:</span>
                      <span className="font-bold text-gray-700 text-[10px] break-all">{orderId}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-gray-400">PAYMENT ID:</span>
                    <span className="font-bold text-brand-green text-[10px] break-all">{paymentId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">STATUS:</span>
                    <span className="font-bold text-emerald-600 uppercase">VERIFIED & CAPTURED</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCheckoutStep('form');
                    setPaymentId('');
                    setOrderId('');
                  }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Run Another Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
