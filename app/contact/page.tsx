'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, MapPin, MessageSquare, CheckCircle, Send, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
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
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h2>
          <p className="text-gray-600">We'll get back to you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 py-16"
    >
      <div className="text-center mb-12">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Get in touch</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">We're here to help</h1>
        <p className="text-gray-500 max-w-md mx-auto">Questions, feedback, or partnership inquiries — we respond within 24 hours.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left side - Contact info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email support</h3>
                <p className="text-sm text-gray-500">For general questions, billing, or technical issues.</p>
                <a href="mailto:support@pollmenow.com" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
                  support@pollmenow.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Press & partnerships</h3>
                <p className="text-sm text-gray-500">Media inquiries, API partnerships, or collaborations.</p>
                <a href="mailto:partners@pollmenow.com" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
                  partners@pollmenow.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Privacy & legal</h3>
                <p className="text-sm text-gray-500">For data protection requests or legal matters.</p>
                <a href="mailto:legal@pollmenow.com" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
                  legal@pollmenow.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Response times</h3>
                <p className="text-sm text-gray-500">Monday–Friday, 9am–6pm EST (excluding holidays). We typically reply within 4–8 hours for Premium users, 24 hours for Free plan.</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                  <CheckCircle className="w-3 h-3" />
                  Emergency contact available for downtime
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office (remote-first)</h3>
                <p className="text-sm text-gray-500">We are a fully remote team. No walk-in support – please email us first.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Contact form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Send us a message</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name *</label>
              <input type="text" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address *</label>
              <input type="email" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 bg-white">
                <option>General inquiry</option>
                <option>Technical support</option>
                <option>Billing question</option>
                <option>Partnership opportunity</option>
                <option>Report abuse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
              <textarea rows={5} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none" />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send message
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              By submitting, you agree to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </form>
        </motion.div>
      </div>

      {/* FAQ section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 bg-gray-50 rounded-2xl p-8 border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Frequently asked questions</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-gray-900 mb-1">Can I delete my data?</p>
            <p className="text-sm text-gray-500">Yes – contact privacy@pollmenow.com and we'll remove your account and associated data within 30 days.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Do you offer refunds?</p>
            <p className="text-sm text-gray-500">We offer refunds within 7 days of initial payment for annual plans. Monthly subscriptions are non-refundable but can be canceled anytime.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">How do I upgrade my plan?</p>
            <p className="text-sm text-gray-500">Go to Settings → Billing in your dashboard. You can upgrade or downgrade anytime.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Is my data secure?</p>
            <p className="text-sm text-gray-500">Yes – we use TLS encryption, hashed passwords, and regular security audits. Read our Privacy Policy for details.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}