'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { useTheme } from '@/app/ThemeContext'; // We'll create this context
import AccountSwitcher from './AccountSwitcher';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  BarChart3, Menu, X, User, LogOut, LayoutDashboard,
  PlusCircle, Search, Bell, Users, Sun, Moon, Home,
  Compass, ChevronRight, Settings, Zap,
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const { organizations } = useAccount();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Notification count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, snap => setUnreadCount(snap.size));
    return () => unsub();
  }, [user]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await auth.signOut();
    router.push('/');
  };

  const isActive = (path: string, exact = false) =>
    exact ? pathname === path : pathname.startsWith(path);

  const hasOrgs = organizations && organizations.length > 0;

  // Theme toggle button
  const ThemeToggle = ({ className = '' }) => (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
        text-gray-500 dark:text-gray-400
        hover:text-primary dark:hover:text-primary
        hover:bg-gray-100 dark:hover:bg-white/8
        border border-transparent hover:border-gray-200 dark:hover:border-white/10
        ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  // Desktop nav link style
  const deskLinkCls = (path: string, exact = false) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path, exact)
        ? 'text-primary dark:text-primary bg-primary/8 dark:bg-primary/15 font-semibold'
        : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5'
    }`;

  // Drawer menu item
  const DrawerLink = ({ to, icon: Icon, label, onClick, badge, danger }: any) => (
    <Link
      href={to}
      onClick={onClick || (() => setDrawerOpen(false))}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all
        ${isActive(to) && !danger
          ? 'bg-primary/8 dark:bg-primary/15 text-primary'
          : danger
            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
        }`}
    >
      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className={
          danger
            ? 'text-red-500 dark:text-red-400'
            : isActive(to)
              ? 'text-primary'
              : 'text-gray-500 dark:text-gray-400'
        } />
      </div>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* TOP NAVBAR */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-[rgba(15,17,32,0.97)] backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-white/7'
            : 'bg-white/80 dark:bg-[rgba(8,9,26,0.85)] backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden xs:block">
              PollMeNow
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className={deskLinkCls('/', true)}>Home</Link>
            <Link href="/explore" className={deskLinkCls('/explore')}>Explore</Link>
            <Link href="/search" className={deskLinkCls('/search')}>Search</Link>
          </div>

          {/* Desktop right section */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <>
                {hasOrgs && <AccountSwitcher />}

                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/8 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none border-2 border-white dark:border-[#08091a]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard */}
                <Link
                  href="/dashboard"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/8 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                >
                  <LayoutDashboard size={17} />
                </Link>

                {/* Create */}
                <Link
                  href="/create"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold shadow-sm hover:shadow-md hover:opacity-90 transition-all"
                >
                  <PlusCircle size={15} />
                  <span>Create</span>
                </Link>

                {/* User dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 transition border border-transparent dark:border-white/8">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                      {user.profileImage
                        ? <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                        : (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
                      }
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate hidden lg:block">
                      {user.name?.split(' ')[0] || user.email}
                    </span>
                  </button>

                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#0f1120] rounded-2xl shadow-xl border border-gray-100 dark:border-white/8 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 origin-top-right scale-95 group-hover:scale-100">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link href={`/profile/${user.uid}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                        <User size={15} className="text-gray-400 dark:text-gray-500" /> Profile
                      </Link>
                      {hasOrgs && (
                        <Link href="/team" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                          <Users size={15} className="text-gray-400 dark:text-gray-500" /> Team
                        </Link>
                      )}
                      <Link href="/upgrade" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-primary hover:bg-primary/10">
                        <Zap size={15} /> Upgrade
                      </Link>
                      <div className="border-t border-gray-100 dark:border-white/8 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 w-full">
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition px-3 py-2">
                  Log in
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold shadow-sm hover:shadow-md hover:opacity-90 transition-all">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: right side controls */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />

            {user && (
              <Link href="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-[#08091a]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[160] w-[min(300px,85vw)] bg-white dark:bg-[#0f1120] flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-safe-top py-4 border-b border-gray-100 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    PollMeNow
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="px-4 py-4 border-b border-gray-100 dark:border-white/8">
                  <Link href={`/profile/${user.uid}`} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base overflow-hidden">
                      {user.profileImage
                        ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                        : (user.name?.[0] || 'U').toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white capitalize">
                        {user.tier || 'free'}
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                <DrawerLink to="/"         icon={Home}          label="Home"         />
                <DrawerLink to="/explore"  icon={Compass}       label="Explore"      />
                <DrawerLink to="/search"   icon={Search}        label="Search"       />

                {user ? (
                  <>
                    <div className="border-t border-gray-100 dark:border-white/8 my-2" />
                    <DrawerLink to="/notifications" icon={Bell}           label="Notifications" badge={unreadCount} />
                    <DrawerLink to="/dashboard"     icon={LayoutDashboard} label="Dashboard"    />
                    <DrawerLink to="/create"        icon={PlusCircle}     label="Create Poll"  />
                    <DrawerLink to={`/profile/${user.uid}`} icon={User}   label="Profile"      />
                    {hasOrgs && (
                      <DrawerLink to="/team" icon={Users} label="Team Management" />
                    )}
                    <DrawerLink to="/upgrade" icon={Zap} label="Upgrade Plan" />
                    <div className="border-t border-gray-100 dark:border-white/8 my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-medium text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <LogOut size={18} className="text-red-500 dark:text-red-400" />
                      </div>
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-gray-100 dark:border-white/8 my-2" />
                    <div className="space-y-2 px-1">
                      <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex items-center justify-center w-full py-3 rounded-2xl border border-gray-200 dark:border-white/12 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition">
                        Log in
                      </Link>
                      <Link href="/register" onClick={() => setDrawerOpen(false)} className="flex items-center justify-center w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-sm">
                        Create free account
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom safe area */}
              <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-100 dark:border-white/8 bg-white/95 dark:bg-[rgba(15,17,32,0.97)] backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">

          {/* Home */}
          <Link href="/" className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${isActive('/', true) ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className="relative">
              <Home size={22} strokeWidth={isActive('/', true) ? 2.5 : 1.8} />
              {isActive('/', true) && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </div>
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          {/* Explore */}
          <Link href="/explore" className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${isActive('/explore') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className="relative">
              <Compass size={22} strokeWidth={isActive('/explore') ? 2.5 : 1.8} />
              {isActive('/explore') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </div>
            <span className="text-[10px] font-semibold">Explore</span>
          </Link>

          {/* Create */}
          <Link href="/create" className="flex flex-col items-center gap-1 flex-1 py-1">
            <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl px-4 py-2 shadow-lg shadow-primary/25 font-bold text-sm">
              <PlusCircle size={17} strokeWidth={2.5} />
              <span>Create</span>
            </div>
          </Link>

          {/* Search */}
          <Link href="/search" className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${isActive('/search') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className="relative">
              <Search size={22} strokeWidth={isActive('/search') ? 2.5 : 1.8} />
              {isActive('/search') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </div>
            <span className="text-[10px] font-semibold">Search</span>
          </Link>

          {/* Profile / Sign in */}
          {user ? (
            <button onClick={() => setDrawerOpen(true)} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${drawerOpen ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className="relative">
                <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    : (user.name?.[0] || 'U').toUpperCase()
                  }
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white dark:border-[#0f1120]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Menu</span>
            </button>
          ) : (
            <Link href="/login" className="flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl text-gray-400 dark:text-gray-500">
              <User size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">Sign in</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}