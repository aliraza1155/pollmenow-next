'use client';

import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';

// This would normally come from a CMS or API, but for now we use the same array
const blogPosts = [
  {
    slug: 'how-to-create-engaging-polls',
    title: 'How to Create Engaging Polls That People Actually Answer',
    content: `
      <p>Creating a poll is easy, but creating one that people actually want to vote on? That takes psychology and strategy.</p>
      <h2>1. Ask a question people care about</h2>
      <p>The best polls tap into current trends, controversies, or universal experiences. Avoid generic questions like "What's your favorite color?" – instead, ask "Which AI tool will dominate 2026?"</p>
      <h2>2. Keep it short and snappy</h2>
      <p>Long questions and options confuse readers. Use clear, simple language. Each option should be a single phrase, not a sentence.</p>
      <h2>3. Use images (seriously)</h2>
      <p>Polls with images get up to 3x more votes. Our AI image generation makes it effortless.</p>
      <h2>4. Add a sense of urgency</h2>
      <p>Time‑limited polls (e.g., "Ends in 1 hour") create FOMO and drive participation.</p>
      <p>Try these tips on your next poll – you'll see the difference.</p>
    `,
    author: 'Sarah Johnson',
    date: '2026-04-15',
    tags: ['Tips', 'Engagement'],
    image: 'https://placehold.co/1200x600/6C5CE7/white?text=Poll+Tips'
  },
  {
    slug: 'ai-poll-generation-guide',
    title: 'The Ultimate Guide to AI Poll Generation',
    content: `<p>Full article content here...</p>`,
    author: 'David Chen',
    date: '2026-04-10',
    tags: ['AI', 'Guide'],
    image: 'https://placehold.co/1200x600/a855f7/white?text=AI+Guide'
  },
  {
    slug: 'privacy-first-polling',
    title: 'Why Privacy‑First Polling Matters in 2026',
    content: `<p>Full article content here...</p>`,
    author: 'Maria Lopez',
    date: '2026-04-05',
    tags: ['Privacy', 'Security'],
    image: 'https://placehold.co/1200x600/ec4899/white?text=Privacy'
  },
  {
    slug: 'monetize-your-audience',
    title: 'Coming Soon: Monetize Your Poll Audience',
    content: `<p>Full article content here...</p>`,
    author: 'Alex Rivera',
    date: '2026-03-28',
    tags: ['Monetization', 'Creators'],
    image: 'https://placehold.co/1200x600/f59e0b/white?text=Monetization'
  }
];

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <img src={post.image} alt={post.title} className="w-full h-64 object-cover" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
              <span className="flex items-center gap-1"><User size={14} /> {post.author}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-gray-100">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
                <ArrowLeft size={14} /> Back to all posts
              </Link>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}