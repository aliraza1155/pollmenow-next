'use client';

import { useState } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, User, Building2 } from 'lucide-react';

export default function AccountSwitcher() {
  const { user } = useAuth();
  const { activeAccount, organizations, switchAccount } = useAccount();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const getDisplayName = () => {
    if (activeAccount === 'personal') return user.name || 'Personal';
    const org = organizations.find(o => o.id === activeAccount);
    return org?.name || 'Organization';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-700 dark:text-gray-200 transition border border-transparent dark:border-white/8"
      >
        <span className="text-sm font-medium">{getDisplayName()}</span>
        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 bg-white dark:bg-[#0f1120] border border-gray-100 dark:border-white/10 rounded-xl shadow-lg z-50 min-w-[200px] overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => { switchAccount('personal'); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                  activeAccount === 'personal'
                    ? 'bg-primary/8 dark:bg-primary/12 text-primary font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <User size={15} /> Personal Account
              </button>

              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => { switchAccount(org.id); setOpen(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                    activeAccount === org.id
                      ? 'bg-primary/8 dark:bg-primary/12 text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Building2 size={15} /> {org.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}