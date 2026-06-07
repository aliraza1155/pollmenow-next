'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Effective: April 28, 2026</p>
          </div>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>By using PollMeNow, you agree to these terms.</p>
            <h2 className="text-base font-semibold text-gray-800">1. Eligibility</h2>
            <p>You must be at least 13 years old to use our service.</p>
            <h2 className="text-base font-semibold text-gray-800">2. Acceptable use</h2>
            <p>You may not use PollMeNow for illegal activities, harassment, spam, or to distribute harmful content.</p>
            <h2 className="text-base font-semibold text-gray-800">3. Intellectual property</h2>
            <p>You retain ownership of your polls and content. We do not claim ownership over your creations.</p>
            <h2 className="text-base font-semibold text-gray-800">4. Termination</h2>
            <p>We may suspend or terminate accounts that violate these terms.</p>
            <h2 className="text-base font-semibold text-gray-800">5. Limitation of liability</h2>
            <p>PollMeNow is provided "as is". We are not liable for any damages arising from your use of the service.</p>
            <p className="mt-4">For questions, contact <a href="mailto:legal@pollmenow.com" className="text-primary hover:underline">legal@pollmenow.com</a>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}