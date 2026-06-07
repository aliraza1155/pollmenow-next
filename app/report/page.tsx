'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Send } from 'lucide-react';

export default function ReportAbusePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report submitted</h2>
          <p className="text-gray-600">Thank you for helping keep PollMeNow safe. We'll review your report within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Flag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Report abuse</h1>
          </div>
          <p className="text-gray-600 mb-6">Use this form to report polls, comments, or users that violate our terms of service.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of abuse *</label>
              <select required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white">
                <option>Harassment or bullying</option>
                <option>Hate speech</option>
                <option>Spam or misleading content</option>
                <option>Impersonation</option>
                <option>Copyright violation</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poll or user link *</label>
              <input type="url" required placeholder="https://pollmenow.com/poll/..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional details</label>
              <textarea rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none" placeholder="Describe the issue..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your email (optional)</label>
              <input type="email" placeholder="We may contact you for clarification" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit report
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}