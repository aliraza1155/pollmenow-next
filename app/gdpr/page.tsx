'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">GDPR Compliance</h1>
            <p className="text-gray-500 text-sm">Your data rights under EU law</p>
          </div>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>PollMeNow is committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR).</p>
            <h2 className="text-base font-semibold text-gray-800">Your rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to access:</strong> You can request a copy of your data.</li>
              <li><strong>Right to rectification:</strong> Correct inaccurate data.</li>
              <li><strong>Right to erasure:</strong> Delete your account and associated data.</li>
              <li><strong>Right to restrict processing:</strong> Limit how we use your data.</li>
              <li><strong>Right to data portability:</strong> Receive your data in a structured format.</li>
              <li><strong>Right to object:</strong> Opt out of certain processing (e.g., analytics).</li>
            </ul>
            <h2 className="text-base font-semibold text-gray-800">How to exercise your rights</h2>
            <p>Contact our Data Protection Officer at <a href="mailto:privacy@pollmenow.com" className="text-primary hover:underline">privacy@pollmenow.com</a>. We will respond within 30 days.</p>
            <h2 className="text-base font-semibold text-gray-800">Data transfers</h2>
            <p>Your data is stored on servers in the United States. For users in the EU, we ensure adequate safeguards through Standard Contractual Clauses.</p>
            <h2 className="text-base font-semibold text-gray-800">Supervisory authority</h2>
            <p>If you believe your data rights have been violated, you have the right to lodge a complaint with your local data protection authority.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}