'use client';

import { motion } from 'framer-motion';
import { Users, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Affiliate Program</h1>
          <p className="text-gray-500 mb-6">Earn money by referring new users to PollMeNow.</p>
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-center gap-2 text-lg font-bold text-gray-800">
              <DollarSign size={24} /> Up to 30% recurring commission
            </div>
            <p className="text-sm text-gray-500 mt-1">On every payment from users you refer</p>
          </div>
          <p className="text-gray-600 mb-6">Our affiliate program is launching soon. Leave your email to get notified.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address" className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-primary" />
            <button className="bg-primary text-white px-5 py-2 rounded-xl font-semibold shadow-sm hover:shadow transition">Notify Me</button>
          </div>
          <p className="text-xs text-gray-400 mt-4">No spam, only important updates.</p>
          <Link href="/" className="inline-block mt-6 text-primary text-sm hover:underline">← Back to home</Link>
        </motion.div>
      </div>
    </div>
  );
}