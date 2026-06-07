'use client';

import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'What is PollMeNow?',
    a: 'PollMeNow is a platform to create, share, and analyse polls. Use AI to generate poll questions, track real‑time results, and get demographic insights.',
  },
  {
    q: 'Is PollMeNow free?',
    a: 'Yes, we have a free plan that includes basic polling features. Premium plans unlock unlimited polls, AI generation, advanced analytics, and private polls.',
  },
  {
    q: 'Do voters need to log in?',
    a: 'No – polls can be set to allow anonymous voting. Premium creators can also require login if needed.',
  },
  {
    q: 'Can I embed polls on my website?',
    a: 'Yes, PollMeNow provides embed codes for polls. This feature is available on Premium plans.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to your profile settings and click "Delete account". You can also contact support@pollmenow.com for assistance.',
  },
  {
    q: 'What data do you collect?',
    a: 'We collect basic account info, poll data, and anonymous vote statistics. See our Privacy Policy for full details.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="text-center mb-8">
            <HelpCircle className="w-10 h-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
            <p className="text-gray-500 text-sm">Find quick answers to common questions</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-gray-100 pb-4 last:border-0"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}