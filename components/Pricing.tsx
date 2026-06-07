'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    name: 'Free',
    priceM: 0,
    priceY: 0,
    desc: 'For individuals getting started',
    features: [
      '5 polls per month',
      '4 options per poll',
      'Basic text-only options',
      'Public polls only',
      'Basic analytics',
      'Login required to vote'
    ],
    cta: 'Get started',
    featured: false,
    tier: 'free'
  },
  {
    name: 'Premium',
    priceM: 9.99,
    priceY: 99.99,
    desc: 'For creators and power users',
    features: [
      'Unlimited polls',
      '10 options per poll',
      'AI poll generation & image options',
      'Private / Friends‑only polls',
      'Advanced analytics & exports',
      'No login required for voters',
      'Priority support',
      'Custom branding'
    ],
    cta: 'Start 14-day free trial',
    featured: true,
    icon: Zap,
    tier: 'premium'
  },
  {
    name: 'Organization',
    priceM: 29.99,
    priceY: 299.99,
    desc: 'For teams and enterprises',
    features: [
      'All Premium features',
      'Team management (admins, poll managers, analysts)',
      'Advanced targeting (age, gender, country)',
      'Organization branding & white-label',
      'Priority placement & custom domain',
      'API access & webhooks',
      'Dedicated account manager',
      '99.9% SLA guarantee'
    ],
    cta: 'Contact sales',
    featured: false,
    icon: Building2,
    tier: 'organization'
  }
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleCta = (plan: typeof plans[0]) => {
    if (plan.tier === 'free') {
      router.push('/register');
    } else if (user) {
      router.push('/upgrade');
    } else {
      router.push('/register');
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-gray-50/60">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Start free. Scale as you grow. No hidden fees, no surprises.
          </p>

          <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-xs">
            <span className={`text-sm transition-colors ${!yearly ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${yearly ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${yearly ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm transition-colors ${yearly ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>Yearly</span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold">Save ~20%</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => {
            const price = yearly ? plan.priceY : plan.priceM;
            const period = plan.priceM === 0 ? 'forever' : yearly ? '/year' : '/month';
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-2xl p-7 ${
                  plan.featured
                    ? 'border-2 border-primary shadow-lg shadow-primary/10'
                    : 'border border-gray-100 shadow-sm'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Most popular
                  </div>
                )}
                {plan.icon && <plan.icon className="w-6 h-6 text-primary mb-3" />}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-5">{plan.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {price !== 0 && <span className="text-sm text-gray-400 ml-1">{period}</span>}
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCta(plan)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.featured
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:shadow-primary/20'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">
          All paid plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}