// app/upgrade/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { callFunction } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, Building2, Sparkles, Star,
  Shield, Users, ArrowRight, X,
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ALL_PLANS = {
  premium_monthly: { id:'premium_monthly',  name:'Premium',      price:9.99,   interval:'month', tier:'premium'      },
  premium_yearly:  { id:'premium_yearly',   name:'Premium',      price:99.99,  interval:'year',  tier:'premium'      },
  org_monthly:     { id:'organization_monthly', name:'Organization', price:29.99, interval:'month', tier:'organization' },
  org_yearly:      { id:'organization_yearly',  name:'Organization', price:299.99,interval:'year',  tier:'organization' },
};

const FREE_FEATURES    = ['5 polls per month','4 options per poll','Public polls only','Basic analytics','Login required to vote'];
const PREMIUM_FEATURES = ['Unlimited polls','10 options per poll','AI poll generation & images','Private / Friends-only polls','Advanced analytics & exports','No login required for voters','Priority support','Custom branding'];
const ORG_FEATURES     = ['All Premium features','Team management (admins, poll managers)','Advanced targeting (age, gender, country)','Organization branding & white-label','Priority placement & custom domain','API access & webhooks','Dedicated account manager','99.9% SLA guarantee'];

const TRUST_ITEMS = [
  { Icon: Shield, label:'SSL Secure'      },
  { Icon: Star,   label:'All major cards' },
  { Icon: Zap,    label:'Cancel anytime'  },
  { Icon: Check,  label:'Stripe verified' },
];

function PaymentForm({ plan, onSuccess, showToast }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/upgrade-success` },
        redirect: 'if_required',
      });
      if (error) showToast('error', error.message);
      else if (paymentIntent?.status === 'succeeded') { showToast('success', 'Payment successful! Upgrading account…'); onSuccess(); }
    } catch { showToast('error', 'Payment failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 pt-5 border-t border-gray-100 dark:border-white/8">
      <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff] mb-4">
        Complete Payment — {plan.name} (${plan.price}/{plan.interval})
      </h3>
      <PaymentElement />
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3.5 font-bold shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</> : `Pay $${plan.price}`}
      </button>
    </form>
  );
}

function FeatureList({ features, highlight = false }: { features: string[]; highlight?: boolean }) {
  return (
    <ul className="space-y-2.5 flex-1">
      {features.map(f => (
        <li key={f} className="flex items-start gap-2.5 text-sm">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${highlight ? 'bg-purple-100 dark:bg-purple-500/20' : 'bg-gray-100 dark:bg-white/8'}`}>
            <Check size={10} className={highlight ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'} />
          </div>
          <span className="text-gray-600 dark:text-gray-400 leading-snug">{f}</span>
        </li>
      ))}
    </ul>
  );
}

export default function UpgradePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const currentTier = user?.tier || 'free';
  const isCurrentPlan = (tier: string) => tier === currentTier;

  const activePremium = yearly ? ALL_PLANS.premium_yearly : ALL_PLANS.premium_monthly;
  const activeOrg = yearly ? ALL_PLANS.org_yearly : ALL_PLANS.org_monthly;

  const handleSelectPlan = async (plan: any) => {
    if (!user) { router.push('/login'); return; }
    if (isCurrentPlan(plan.tier)) { showToast('info', 'You are already on this plan.'); return; }
    setSelectedPlan(plan);
    setLoading(true);
    try {
      const result = await callFunction('createPaymentIntent', { amount: plan.price, currency: 'usd', metadata: { planId: plan.id, userId: user.uid } }) as { clientSecret: string };
      setClientSecret(result.clientSecret);
    } catch { showToast('error', 'Failed to initialize payment.'); }
    finally { setLoading(false); }
  };

  const handlePaymentSuccess = async () => {
    await new Promise(r => setTimeout(r, 3000));
    await refreshUser();
    showToast('success', 'Upgrade complete! You now have premium features.');
    router.push('/dashboard');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800 dark:text-[#f0f0ff] mb-4">Please sign in to upgrade</p>
        <Link href="/login" className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl px-6 py-3 font-bold shadow-lg">Sign in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#08091a]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className={`rounded-2xl px-4 py-3 shadow-xl text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/25 text-green-800 dark:text-green-300'
              : toast.type === 'error' ? 'bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 text-red-800 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/25 text-blue-800 dark:text-blue-300'
            }`}>{toast.msg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={13} /> Plans & Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-[#f0f0ff] mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">Start free. Scale as you grow. No hidden fees.</p>
        </div>

        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-white/5 rounded-2xl px-4 py-2.5">
            <span className={`text-sm font-bold transition ${!yearly ? 'text-gray-900 dark:text-[#f0f0ff]' : 'text-gray-400 dark:text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setYearly(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${yearly ? 'bg-gradient-to-r from-purple-600 to-purple-500' : 'bg-gray-300 dark:bg-white/20'}`}
              aria-label="Toggle billing"
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${yearly ? 'left-[26px]' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-bold transition ${yearly ? 'text-gray-900 dark:text-[#f0f0ff]' : 'text-gray-400 dark:text-gray-500'}`}>Yearly</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/12 px-2 py-0.5 rounded-full">
              Save ~20%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-12">
          {/* Free */}
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-200 dark:border-white/10 p-5 sm:p-6 flex flex-col shadow-sm">
            <div className="mb-5">
              <div className="w-10 h-10 bg-gray-100 dark:bg-white/8 rounded-2xl flex items-center justify-center mb-3">
                <Users size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Free</h3>
              <div className="flex items-end gap-1 mt-2"><span className="text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">$0</span><span className="text-sm text-gray-400 dark:text-gray-500 mb-1">/ forever</span></div>
            </div>
            <FeatureList features={FREE_FEATURES} />
            <div className="mt-6">
              {isCurrentPlan('free') ? (
                <div className="w-full text-center text-sm font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/12 rounded-xl py-3">Current plan</div>
              ) : (
                <Link href="/register" className="block w-full text-center border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 rounded-xl py-3 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition">Get started free</Link>
              )}
            </div>
          </div>

          {/* Premium */}
          <div className="relative bg-white dark:bg-[#0f1120] rounded-2xl border-2 border-purple-500 p-5 sm:p-6 flex flex-col shadow-lg">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">Most popular</div>
            <div className="mb-5">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/15 rounded-2xl flex items-center justify-center mb-3">
                <Zap size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">{activePremium.name}</h3>
              <div className="flex items-end gap-1 mt-2"><span className="text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">${activePremium.price}</span><span className="text-sm text-gray-400 dark:text-gray-500 mb-1">/ {activePremium.interval}</span></div>
            </div>
            <FeatureList features={PREMIUM_FEATURES} highlight />
            <div className="mt-6">
              {isCurrentPlan('premium') ? (
                <div className="w-full text-center text-sm font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/12 rounded-xl py-3">Current plan</div>
              ) : (
                <button onClick={() => handleSelectPlan(activePremium)} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  Upgrade to Premium <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-200 dark:border-white/10 p-5 sm:p-6 flex flex-col shadow-sm">
            <div className="mb-5">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/12 rounded-2xl flex items-center justify-center mb-3">
                <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">{activeOrg.name}</h3>
              <div className="flex items-end gap-1 mt-2"><span className="text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">${activeOrg.price}</span><span className="text-sm text-gray-400 dark:text-gray-500 mb-1">/ {activeOrg.interval}</span></div>
            </div>
            <FeatureList features={ORG_FEATURES} />
            <div className="mt-6">
              {isCurrentPlan('organization') ? (
                <div className="w-full text-center text-sm font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/12 rounded-xl py-3">Current plan</div>
              ) : (
                <button onClick={() => handleSelectPlan(activeOrg)} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  Upgrade to Org <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 border-t border-gray-100 dark:border-white/8 pt-8 mb-8">
          {TRUST_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div className="w-7 h-7 bg-gray-100 dark:bg-white/8 rounded-xl flex items-center justify-center"><item.Icon size={14} className="text-gray-500 dark:text-gray-400" /></div>
              {item.label}
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Have questions?{' '}
            <Link href="/faq" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">View our FAQ</Link>
            {' '}or{' '}
            <Link href="/contact" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">contact us</Link>.
          </p>
        </div>

        {clientSecret && selectedPlan && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="max-w-md mx-auto mt-10 bg-white dark:bg-[#0f1120] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-[#f0f0ff]">Complete Payment</h3>
              <button onClick={() => { setSelectedPlan(null); setClientSecret(null); }} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                <X size={15} />
              </button>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme:'stripe', variables:{ colorPrimary:'#6C5CE7', borderRadius:'12px' } } }}>
              <PaymentForm plan={selectedPlan} onSuccess={handlePaymentSuccess} showToast={showToast} />
            </Elements>
          </motion.div>
        )}
      </div>
    </div>
  );
}