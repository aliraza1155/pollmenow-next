'use client';

import Link from 'next/link';
import { Mail, BarChart3, Heart, Shield, HelpCircle, Sparkles, Code } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features', isRoute: false },
      { label: 'AI Spotlight', href: '#ai', isRoute: false },
      { label: 'Pricing', href: '#pricing', isRoute: false },
      { label: 'Explore polls', href: '/explore', isRoute: true },
      { label: 'Search', href: '/search', isRoute: true },
      { label: 'Create poll', href: '/create', isRoute: true },
    ],
    company: [
      { label: 'About us', href: '/about', isRoute: true },
      { label: 'Contact', href: '/contact', isRoute: true },
      { label: 'Blog', href: '/blog', isRoute: true },
      { label: 'Affiliates', href: '/affiliates', isRoute: true },
    ],
    support: [
      { label: 'Help center', href: '/help', isRoute: true },
      { label: 'FAQ', href: '/faq', isRoute: true },
      { label: 'Status', href: '/status', isRoute: true },
      { label: 'Report abuse', href: '/report', isRoute: true },
    ],
    legal: [
      { label: 'Privacy policy', href: '/privacy', isRoute: true },
      { label: 'Terms of service', href: '/terms', isRoute: true },
      { label: 'Cookie policy', href: '/cookies', isRoute: true },
      { label: 'GDPR compliance', href: '/gdpr', isRoute: true },
    ],
  };

  return (
    <footer className="bg-gray-950 text-gray-400 pt-12 pb-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-sm">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl">PollMeNow</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-[220px]">
              AI-powered real-time polling. Capture opinions instantly, engage your audience, and make data-driven decisions.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="mailto:support@pollmenow.com" className="text-gray-500 hover:text-primary transition" aria-label="Email">
                <Mail size={18} />
              </a>
              <a href="https://github.com/pollmenow" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition" aria-label="GitHub">
                <Code size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 flex items-center gap-1.5">
              <Sparkles size={14} /> Product
            </h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 flex items-center gap-1.5">
              <Heart size={14} /> Company
            </h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 flex items-center gap-1.5">
              <HelpCircle size={14} /> Support
            </h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="pt-2">
                <a href="mailto:support@pollmenow.com" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <Mail size={14} />
                  support@pollmenow.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 flex items-center gap-1.5">
              <Shield size={14} /> Legal
            </h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                Stripe-verified business
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <span>© {currentYear} PollMeNow, Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition">Terms</Link>
            <Link href="/cookies" className="hover:text-primary transition">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}