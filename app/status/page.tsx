'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Activity, Clock } from 'lucide-react';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <div className="text-center mb-8">
            <Activity className="w-10 h-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Status</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-600">All systems operational</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800">API & Poll creation</span>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Operational</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800">Voting & real‑time updates</span>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Operational</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800">Firebase Authentication</span>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Operational</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800">AI poll generation</span>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Operational</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Last updated: {new Date().toLocaleString()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}