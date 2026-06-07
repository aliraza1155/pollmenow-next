// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap, Brain, Users, Clock, ArrowRight, BarChart3, Shield, Globe,
  Sparkles, Target, Lock, Share2, Award, DollarSign, CheckCircle,
  Layout, Video, Smile, Building, Check, MessageCircle, Activity,
  Image as ImageIcon, Bot, Layers, Radio, MapPin, Calendar,
  UsersRound, Building2, TrendingUp
} from 'lucide-react';

// Error Boundary (keeps from crashing)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <button onClick={() => window.location.reload()} className="mt-4 bg-primary text-white px-5 py-2 rounded-xl">Refresh</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ------------------------- Hero Section (demo vote counter, clearly labelled) -------------------------
function HeroSection() {
  const { user } = useAuth();
  const [demoVotes, setDemoVotes] = useState(2841);
  useEffect(() => {
    const interval = setInterval(() => setDemoVotes(prev => prev + Math.floor(Math.random() * 5) + 1), 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 to-transparent rounded-full" />
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-7">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> AI‑powered polling
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-gray-900">
              Create a poll in <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">10 seconds</span>
              <br />with AI
            </h1>
            <p className="text-lg text-gray-500 max-w-md">Just describe your topic – we generate the question and answers automatically.</p>

            {/* Demo preview – clearly labelled as example */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase">Demo preview</span>
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> example poll</div>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-4">"How do you prefer to gather feedback?"</p>
              <div className="space-y-3">
                {[{ label: 'AI polls', pct: 72 }, { label: 'Long surveys', pct: 15 }, { label: 'Email forms', pct: 13 }].map(opt => (
                  <div key={opt.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{opt.label}</span><span className="font-semibold text-gray-700">{opt.pct}%</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${opt.pct}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span><Users className="w-3 h-3 inline mr-1" />{demoVotes.toLocaleString()} demo votes</span>
                <span className="text-primary font-medium">Preview only</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={user ? "/create" : "/register"} className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl">Create your first poll →</Link>
              <Link href="/explore" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50">See example polls</Link>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />No credit card required</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Cancel anytime</span>
            </div>
          </motion.div>
          {/* Dashboard preview (purely visual) */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gray-950 rounded-2xl p-6 shadow-2xl border border-white/15">
              <div className="flex justify-between border-b border-white/10 pb-3 mb-4">
                <span className="text-xs font-semibold text-green-400 uppercase">Live analytics</span>
                <span className="text-[10px] text-white/60 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+12% vs last hour</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white/5 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-white">2,845</div><div className="text-[10px] text-white/40">Total votes</div></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-emerald-400">68.2%</div><div className="text-[10px] text-white/40">Engagement</div></div>
              </div>
              <div className="mb-4"><p className="text-white/90 text-sm font-semibold mb-2">AI‑generated poll</p><p className="text-white text-sm">"What is the most critical feature for 2026?"</p></div>
              <div className="space-y-2.5">
                {[{ label: 'AI Automation', pct: 44, color: 'bg-emerald-400' }, { label: 'Privacy Control', pct: 30, color: 'bg-blue-400' }, { label: 'Cross-Platform', pct: 16, color: 'bg-violet-400' }].map(row => (
                  <div key={row.label}><div className="flex justify-between text-xs mb-1"><span className="text-white/70">{row.label}</span><span className="text-white">{row.pct}%</span></div><div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} /></div></div>
                ))}
              </div>
              <div className="mt-4 text-center"><span className="text-[10px] text-primary/80">Powered by PollMeNow AI</span></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ------------------------- AI Spotlight -------------------------
function AISpotlight() {
  const CAPABILITIES = [
    { icon: '🤖', title: 'Auto‑generate full polls', desc: 'Describe a topic – AI writes the question and up to 6 balanced options.', badge: null },
    { icon: '✏️', title: 'AI rephrase & improve', desc: 'Polish your wording for clarity and engagement.', badge: null },
    { icon: '🖼', title: 'AI image generation', desc: 'Generate custom images for poll options (Premium).', badge: 'Premium' },
    { icon: '🛡', title: 'Content moderation', desc: 'Automatically scanned for inappropriate content.', badge: null }
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-extrabold text-primary uppercase mb-3">AI assistant</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Let AI do the heavy lifting</h2>
          <p className="text-gray-500 mb-8">Just describe your topic – PollMeNow crafts professional polls instantly. No prompting experience needed.</p>
          <div className="space-y-5">
            {CAPABILITIES.map(cap => (
              <div key={cap.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{cap.icon}</div>
                <div><div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-gray-800">{cap.title}</span>{cap.badge && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Premium</span>}</div><p className="text-sm text-gray-500">{cap.desc}</p></div>
              </div>
            ))}
          </div>
          <Link href="/create" className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg">🤖 Try AI generation free →</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gray-50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-white border-b px-4 py-3 flex items-center gap-2"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div><div className="flex-1 text-center text-xs text-gray-400">PollMeNow AI assistant</div><div className="w-2 h-2 rounded-full bg-primary animate-pulse"/></div>
          <div className="p-5 space-y-3">
            <div className="flex justify-end"><div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl rounded-br-md px-4 py-2 text-sm">Create a poll about remote work preferences for 2026</div></div>
            <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 text-sm text-gray-500"><span className="animate-pulse">···</span> Generating your poll...</div></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2">
              <div className="flex justify-between mb-3"><span className="text-xs font-bold text-primary uppercase">✦ AI generated</span><span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ready to publish</span></div>
              <p className="font-bold text-gray-800 mb-3">"What is your preferred work model in 2026?"</p>
              <div className="space-y-2">{['Fully remote','Hybrid','Fully in-office','Flexible contract'].map(opt => <div key={opt} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-700"><div className="w-4 h-4 border border-primary rounded-sm"/>{opt}</div>)}</div>
              <div className="flex gap-2 mt-4"><Link href="/create" className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold">Publish poll</Link><button className="border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs">Regenerate</button></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------- Features (accurate) -------------------------
const features = [
  { icon: Bot, title: "AI Poll Generation", desc: "Type any topic – AI creates balanced questions and options.", premium: false },
  { icon: Activity, title: "Real-Time Results", desc: "Votes update instantly – no refresh needed.", premium: false },
  { icon: Lock, title: "Flexible Privacy", desc: "Public, friends‑only, or private with access code.", premium: true },
  { icon: Share2, title: "Viral Sharing", desc: "One‑click share & embed widgets anywhere.", premium: false },
  { icon: Target, title: "Audience Targeting", desc: "Reach specific age, gender, or country (Premium).", premium: true },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Demographics, engagement rates, exports (Premium).", premium: true },
  { icon: ImageIcon, title: "Rich Media", desc: "Add images to questions or options.", premium: false },
  { icon: Shield, title: "Anonymous Voting", desc: "Let people vote without logging in.", premium: false },
  { icon: Globe, title: "Global Reach", desc: "Collect votes from any country.", premium: false }
];
function FeaturesGrid() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center mb-12"><h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to run successful polls</h2><p className="text-gray-500 text-lg">No fluff – just the features that matter.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <f.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-gray-800 mb-1">{f.title}{f.premium && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Premium</span>}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ------------------------- Persona Sections -------------------------
function PersonaSections() {
  const personas = [
    { title: "For Individuals", icon: Smile, color: "from-amber-500 to-orange-500", benefits: ["Fun polls for friends & family", "Share opinions on trending topics", "Embed polls in social media", "No login required to vote"] },
    { title: "For Businesses", icon: Building, color: "from-blue-500 to-cyan-500", benefits: ["Market research & product feedback", "Customer satisfaction surveys", "Employee pulse checks", "Target demographics"] },
    { title: "For Creators", icon: Award, color: "from-purple-500 to-pink-500", benefits: ["Boost engagement on YouTube/TikTok", "Let audience vote on content", "Monetize trending polls (soon)", "Real‑time audience insights"] }
  ];
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto text-center mb-12"><h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for everyone</h2><p className="text-gray-500">No matter who you are – there's a reason to use PollMeNow.</p></div>
      <div className="grid md:grid-cols-3 gap-8">
        {personas.map((p, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}><p.icon className="w-6 h-6 text-white" /></div>
            <h3 className="text-xl font-bold mb-3">{p.title}</h3>
            <ul className="space-y-2">{p.benefits.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />{b}</li>)}</ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ------------------------- How It Works (3 steps) -------------------------
function HowItWorks() {
  const steps = [
    { num: "01", icon: "🤖", title: "Describe your topic", desc: "Type any topic – our AI crafts a professional, unbiased poll.", highlight: "Takes under 10 seconds" },
    { num: "02", icon: "🎯", title: "Customize & target", desc: "Choose privacy, duration, and targeting (age, gender, country).", highlight: "Reach the right audience" },
    { num: "03", icon: "📊", title: "Watch results live", desc: "Votes flow in real time to your dashboard.", highlight: "Real‑time analytics" }
  ];
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center mb-12"><p className="text-xs font-bold text-primary uppercase mb-2">How it works</p><h2 className="text-3xl sm:text-4xl font-bold mb-4">From idea to live poll in three steps</h2><p className="text-gray-500">No design skills. No survey expertise. Just your topic and our AI.</p></div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md">
            <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-3xl mb-4">{s.icon}<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold flex items-center justify-center">{i+1}</div></div>
            <p className="text-xs font-bold text-primary mb-2">{s.num}</p><h3 className="font-bold text-gray-800 mb-2">{s.title}</h3><p className="text-sm text-gray-500 mb-3">{s.desc}</p><span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{s.highlight}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ------------------------- Pricing (no free trial – just "Free forever" + paid plans) -------------------------
function Pricing() {
  const [yearly, setYearly] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const plans = [
    { name: "Free", priceM: 0, priceY: 0, desc: "For individuals", features: ["5 polls/month", "4 options/poll", "Public polls only", "Basic analytics"], featured: false, tier: "free", cta: "Get started" },
    { name: "Premium", priceM: 9.99, priceY: 99.99, desc: "For creators", features: ["Unlimited polls", "10 options/poll", "AI image generation", "Private polls", "Advanced analytics", "No login required", "Priority support"], featured: true, tier: "premium", cta: "Upgrade", icon: Zap },
    { name: "Organization", priceM: 29.99, priceY: 299.99, desc: "For teams", features: ["All Premium features", "Team management", "Advanced targeting", "White‑label branding", "API access", "Dedicated support", "99.9% SLA"], featured: false, tier: "organization", cta: "Contact sales", icon: Building2 }
  ];
  const handleCta = (plan: any) => {
    if (plan.tier === "free") router.push("/register");
    else if (user) router.push(`/upgrade?plan=${plan.tier}`);
    else router.push("/register");
  };
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10"><p className="text-xs font-bold text-primary uppercase mb-2">Pricing</p><h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2><p className="text-gray-500">Start free. Scale as you grow. No hidden fees.</p>
          <div className="inline-flex items-center gap-3 mt-6 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <span className={`text-sm ${!yearly ? "font-bold text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button onClick={() => setYearly(!yearly)} className={`relative w-10 h-5 rounded-full transition ${yearly ? "bg-primary" : "bg-gray-300"}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${yearly ? "left-[22px]" : "left-0.5"}`} /></button>
            <span className={`text-sm ${yearly ? "font-bold text-gray-900" : "text-gray-400"}`}>Yearly</span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Save ~20%</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const price = yearly ? plan.priceY : plan.priceM;
            const period = plan.priceM === 0 ? "forever" : yearly ? "/year" : "/month";
            return (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className={`relative bg-white rounded-2xl p-6 ${plan.featured ? "border-2 border-primary shadow-lg" : "border border-gray-100 shadow-sm"}`}>
                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1 rounded-full">Most popular</div>}
                {plan.icon && <plan.icon className="w-6 h-6 text-primary mb-3" />}
                <h3 className="text-xl font-bold">{plan.name}</h3><p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-5"><span className="text-3xl font-extrabold">{price === 0 ? "Free" : `$${price}`}</span>{price !== 0 && <span className="text-gray-400 text-sm ml-1">{period}</span>}</div>
                <ul className="space-y-2 mb-6">{plan.features.map(f => <li key={f} className="flex items-start gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{f}</li>)}</ul>
                <button onClick={() => handleCta(plan)} className={`w-full py-2 rounded-xl font-semibold transition ${plan.featured ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>{plan.cta}</button>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Free plan forever – no credit card required. Paid plans can be canceled anytime.</p>
      </div>
    </section>
  );
}

// ------------------------- Monetization (future) -------------------------
function MonetizationSpotlight() {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1 text-sm font-semibold text-primary shadow-sm mb-4"><DollarSign size={16} /> Coming soon</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Turn your influence into income</h2>
          <p className="text-gray-600 text-lg mb-6">Trending poll creators will soon be able to accept sponsored polls from brands. Earn money for every sponsored vote.</p>
          <ul className="space-y-3 max-w-md mx-auto lg:mx-0">
            <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> Get discovered by brands</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> Set your own sponsorship rates</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> Transparent earnings dashboard</li>
          </ul>
          <div className="mt-8"><Link href="/register" className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-5 py-2 rounded-xl font-semibold hover:bg-primary/5">Join the waitlist <ArrowRight size={16} /></Link></div>
        </div>
        <div className="flex-1 flex justify-center"><div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm"><div className="flex items-center gap-3 mb-4"><Award className="w-8 h-8 text-primary" /><span className="font-bold text-gray-900">Creator Spotlight</span></div><div className="space-y-3"><div className="flex justify-between text-sm"><span>🔥 Example trending poll</span><span className="text-primary font-semibold">2,347 votes</span></div><div className="flex justify-between text-sm"><span>💰 Estimated sponsorship value</span><span className="text-green-600 font-bold">$180 – $250</span></div><div className="h-px bg-gray-100 my-2" /><p className="text-xs text-gray-500">Top creators will be eligible for sponsorship opportunities.</p></div></div></div>
      </div>
    </section>
  );
}

// ------------------------- Final CTA (no testimonial section, just direct) -------------------------
function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-primary to-secondary">
      <div className="max-w-4xl mx-auto text-center"><h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to create your first poll?</h2><p className="text-indigo-100 text-lg mb-8">It's free, it takes 10 seconds, and you'll love the results.</p><Link href={user ? "/create" : "/register"} className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl">Create free poll <ArrowRight size={18} /></Link><p className="text-indigo-100 text-sm mt-6">No credit card required. Cancel anytime.</p></div>
    </section>
  );
}

// ------------------------- Main Export -------------------------
export default function HomePage() {
  return (
    <ErrorBoundary>
      <div className="overflow-hidden">
        <HeroSection />
        <AISpotlight />
        <FeaturesGrid />
        <PersonaSections />
        <HowItWorks />
        <Pricing />
        <MonetizationSpotlight />
        <FinalCTA />
      </div>
    </ErrorBoundary>
  );
}