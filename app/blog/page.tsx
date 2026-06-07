'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Calendar, User } from 'lucide-react';

const blogPosts = [
  {
    slug: 'how-to-create-engaging-polls',
    title: 'How to Create Engaging Polls That People Actually Answer',
    excerpt: 'Learn the psychology behind viral polls and how to craft questions that drive participation.',
    author: 'Sarah Johnson',
    date: '2026-04-15',
    tags: ['Tips', 'Engagement'],
    image: 'https://placehold.co/600x400/6C5CE7/white?text=Poll+Tips'
  },
  {
    slug: 'ai-poll-generation-guide',
    title: 'The Ultimate Guide to AI Poll Generation',
    excerpt: 'Discover how our AI creates balanced, unbiased polls in seconds – and how to get the best results.',
    author: 'David Chen',
    date: '2026-04-10',
    tags: ['AI', 'Guide'],
    image: 'https://placehold.co/600x400/a855f7/white?text=AI+Guide'
  },
  {
    slug: 'privacy-first-polling',
    title: 'Why Privacy‑First Polling Matters in 2026',
    excerpt: 'How PollMeNow protects voter anonymity and gives creators full control over their data.',
    author: 'Maria Lopez',
    date: '2026-04-05',
    tags: ['Privacy', 'Security'],
    image: 'https://placehold.co/600x400/ec4899/white?text=Privacy'
  },
  {
    slug: 'monetize-your-audience',
    title: 'Coming Soon: Monetize Your Poll Audience',
    excerpt: 'We’re building a sponsorship marketplace for trending poll creators. Here’s what you need to know.',
    author: 'Alex Rivera',
    date: '2026-03-28',
    tags: ['Monetization', 'Creators'],
    image: 'https://placehold.co/600x400/f59e0b/white?text=Monetization'
  }
];

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = [...new Set(blogPosts.flatMap(p => p.tags))];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">PollMeNow Blog</h1>
          <p className="text-gray-500">Insights, tips, and news about modern polling</p>
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none"
          >
            <option value="">All tags</option>
            {allTags.map(tag => <option key={tag}>{tag}</option>)}
          </select>
        </div>

        {/* Blog grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPosts.map((post, idx) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h2>
                <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="text-primary text-sm font-semibold hover:underline">
                  Read more →
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}