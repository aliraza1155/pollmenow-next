'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="bg-gradient-to-r from-primary to-purple-800 py-20">
      <div className="max-w-4xl mx-auto text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Get Instant Insights on What Your Audience Thinks
        </h2>
        <p className="text-purple-100 text-lg mb-8">
          Join thousands of creators using PollMeNow to go viral and understand their community.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          Start Now – It's Free <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-purple-200 text-sm mt-4">No credit card required · 30-day Pro trial · Cancel anytime</p>
      </div>
    </section>
  );
}