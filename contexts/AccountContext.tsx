'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface ActiveOrganization extends Organization {
  [key: string]: any;
}

interface AccountContextType {
  activeAccount: string | null;
  organizations: Organization[];
  activeOrganization: ActiveOrganization | null;
  hasPersonalAccount: boolean;
  loading: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshActiveOrganization: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser: refreshAuthUser } = useAuth();
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<ActiveOrganization | null>(null);
  const [hasPersonalAccount, setHasPersonalAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const isSwitching = useRef(false);

  const loadUserData = async () => {
    if (!user) {
      setActiveAccount(null);
      setOrganizations([]);
      setActiveOrganization(null);
      setHasPersonalAccount(false);
      setLoading(false);
      return;
    }

    if (isSwitching.current) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }
      const data = userDoc.data();
      const memberships = data?.memberships || {};

      // Build organizations list (only for individual users; organization owners have no other orgs)
      const orgs = await Promise.all(
        Object.entries(memberships).map(async ([id, membership]: [string, any]) => {
          try {
            const orgDoc = await getDoc(doc(db, 'organizations', id));
            return {
              id,
              name: orgDoc.exists() ? orgDoc.data().name : (membership.name || 'Organization'),
              role: membership.role,
            };
          } catch {
            return { id, name: membership.name || 'Organization', role: membership.role };
          }
        })
      );
      setOrganizations(orgs);

      // ✅ Only individuals have a personal account
      const isIndividual = data?.type === 'individual';
      setHasPersonalAccount(isIndividual);

      // Active account logic
      let active = user.activeAccount; // already set by AuthContext
      // If the user is an organization owner, active should be their uid (not 'personal')
      if (!isIndividual && (!active || active === 'personal')) {
        active = user.uid; // fallback to own uid
      }
      // Validate: if active is an org but user is no longer a member, fallback to personal (if individual) or first org
      if (active !== 'personal' && !memberships[active] && active !== user.uid) {
        active = isIndividual ? 'personal' : (orgs[0]?.id || user.uid);
      }
      setActiveAccount(active);
      await fetchActiveOrganization(active);
    } catch (err) {
      console.error('AccountContext loadUserData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrganization = async (accountId: string | null) => {
    if (accountId && accountId !== 'personal') {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', accountId));
        if (orgDoc.exists()) {
          setActiveOrganization({ id: accountId, ...orgDoc.data() });
        } else {
          setActiveOrganization(null);
        }
      } catch {
        setActiveOrganization(null);
      }
    } else {
      setActiveOrganization(null);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.uid]);

  useEffect(() => {
    if (!activeAccount || activeAccount === 'personal') return;
    const unsubscribe = onSnapshot(
      doc(db, 'organizations', activeAccount),
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveOrganization({ id: activeAccount, ...docSnap.data() });
          setOrganizations(prev =>
            prev.map(org =>
              org.id === activeAccount ? { ...org, name: docSnap.data().name } : org
            )
          );
        }
      }
    );
    return () => unsubscribe();
  }, [activeAccount]);

  const switchAccount = async (accountId: string) => {
    if (!user || accountId === activeAccount) return;
    // ❌ Prevent switching to 'personal' if user has no personal account
    if (accountId === 'personal' && !hasPersonalAccount) {
      console.warn('Cannot switch to personal account – user is not an individual');
      return;
    }
    isSwitching.current = true;
    try {
      await updateDoc(doc(db, 'users', user.uid), { activeAccount: accountId });
      setActiveAccount(accountId);
      await fetchActiveOrganization(accountId);
    } catch (err) {
      console.error('switchAccount error:', err);
    } finally {
      isSwitching.current = false;
    }
  };

  const refreshUser = async () => {
    await refreshAuthUser();
    isSwitching.current = false;
    await loadUserData();
  };

  const refreshActiveOrganization = async () => {
    if (activeAccount && activeAccount !== 'personal') {
      await fetchActiveOrganization(activeAccount);
    }
  };

  return (
    <AccountContext.Provider value={{
      activeAccount,
      organizations,
      activeOrganization,
      hasPersonalAccount,
      loading,
      switchAccount,
      refreshUser,
      refreshActiveOrganization,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};