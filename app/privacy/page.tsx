'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Effective: April 28, 2026</p>
          </div>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>Your privacy is important to us. This policy explains what data we collect, why we collect it, and how we protect it.</p>
            <h2 className="text-base font-semibold text-gray-800">1. Information we collect</h2>
            <p>We collect information you provide directly (email, name, polls, votes), automatically (IP address, device info), and from third parties (Google sign‑in).</p>
            <h2 className="text-base font-semibold text-gray-800">2. How we use your data</h2>
            <p>We use your data to operate the platform, improve features, send notifications, and comply with legal obligations.</p>
            <h2 className="text-base font-semibold text-gray-800">3. Data sharing</h2>
            <p>We never sell your personal data. Aggregated analytics may be shared publicly, but individual voter identities are never exposed without consent.</p>
            <h2 className="text-base font-semibold text-gray-800">4. Your rights</h2>
            <p>You can access, correct, or delete your data at any time. Contact privacy@pollmenow.com for assistance.</p>
            <h2 className="text-base font-semibold text-gray-800">5. Security</h2>
            <p>We use TLS encryption, hashed passwords, and regular security audits to protect your data.</p>
            <p className="mt-4">For full details, please contact us at <a href="mailto:privacy@pollmenow.com" className="text-primary hover:underline">privacy@pollmenow.com</a>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}