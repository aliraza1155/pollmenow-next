// app/create/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { db, storage } from '@/lib/firebase';
import { doc, addDoc, collection, getDoc, updateDoc, serverTimestamp, Timestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CATEGORIES, POLL_TYPES, VISIBILITY_OPTIONS, DURATION_OPTIONS, MAX_TITLE_LENGTH, MAX_OPTION_LENGTH, MAX_TAGS } from '@/lib/constants';
import { canCreatePollType, canUseVisibility, getMaxOptions, getMonthlyPollLimit, hasTargeting, canUseAIPollGeneration } from '@/lib/tierUtils';
import { generatePollSuggestions, generatePollFromURL, generateAndUploadImage, getDetailedPrompt } from '@/lib/ai';
import MediaPicker from '@/components/MediaPicker';
import { TagInput } from '@/components/UI';
import { canCreatePoll, canSchedulePollInOrg } from '@/lib/permissions';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const cleanObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = cleanObject(v);
  }
  return out;
};

const POLL_TYPE_ICONS = { quick:'⚡', yesno:'✅', rating:'⭐', comparison:'⚖', live:'🔴' } as const;
type PollTypeKey = keyof typeof POLL_TYPE_ICONS;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">{children}</p>;
}

function FormCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-[#0f1120] border border-gray-100 dark:border-white/8 rounded-2xl p-5 mb-4 shadow-sm ${className}`}>{children}</div>;
}

function Toggle({ value, onChange, disabled = false, disabledReason = '' }: { value: boolean; onChange: (val: boolean) => void; disabled?: boolean; disabledReason?: string }) {
  return (
    <div className="relative inline-flex items-center">
      <div
        onClick={() => !disabled && onChange(!value)}
        className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full transition-colors duration-200 ${
          value ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gray-300 dark:bg-white/15'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      {disabled && disabledReason && <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 italic">{disabledReason}</span>}
    </div>
  );
}

function AiImageButton({ onGenerate, loading, disabled, label = '🤖 AI' }: { onGenerate: () => void; loading: boolean; disabled: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={loading || disabled}
      className={`bg-gradient-to-r from-primary to-secondary text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1 transition ${
        loading || disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
      }`}
    >
      {loading ? '⏳' : '🤖'} {label}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0f1120] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10">
        {children}
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function CreatePollContent() {
  const { user, refreshUser } = useAuth();
  const { activeAccount, organizations, loading: accountLoading } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const isPersonal = activeAccount === 'personal';
  const activeOrg = isPersonal ? null : organizations.find(o => o.id === activeAccount);
  const contextType = isPersonal ? 'personal' : 'organization';
  const orgId = activeOrg?.id || null;
  const orgRole = activeOrg?.role || null;

  const canCreate = canCreatePoll(user, activeAccount, orgId);
  const canScheduleOrgPoll = canSchedulePollInOrg(orgRole);

  const [orgStats, setOrgStats] = useState({ pollsThisMonth: 0, tier: 'organization', pollsCreated: 0 });
  const [permissionError, setPermissionError] = useState(false);

  // Form state
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('quick');
  const [visibility, setVisibility] = useState('public');
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [options, setOptions] = useState<{ id: string; text: string }[]>([{ id:'1', text:'' }, { id:'2', text:'' }]);
  const [ratingScale, setRatingScale] = useState({ min: 1, max: 5, step: 1 });
  const [qMedia, setQMedia] = useState<string | null>(null);
  const [optMedia, setOptMedia] = useState<Record<string, string>>({});
  const [customCat, setCustomCat] = useState('');
  const [domainRestr, setDomainRestr] = useState({ enabled: false, domains: '' });
  const [isMultiOptionRating, setIsMultiOptionRating] = useState(false);
  const [targeting, setTargeting] = useState({ enabled: false, ageRange: [18, 65], genders: [] as string[], countries: [] as string[] });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [mediaChoice, setMediaChoice] = useState('question');
  const [isComparison, setIsComparison] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState({ question: false, poll: false });
  const [aiTopic, setAiTopic] = useState('');
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [generatingImageForOptions, setGeneratingImageForOptions] = useState<Record<string, boolean>>({});
  const [questionImageKey, setQuestionImageKey] = useState(0);
  const [optionImageKeys, setOptionImageKeys] = useState<Record<string, number>>({});
  const [selectedImageStyle, setSelectedImageStyle] = useState('auto');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  const [showInPublicFeed, setShowInPublicFeed] = useState(true);

  const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
  const [aiTempOptionsCount, setAiTempOptionsCount] = useState(4);
  const [showUrlInputModal, setShowUrlInputModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [showUrlOptionsModal, setShowUrlOptionsModal] = useState(false);
  const [urlTempType, setUrlTempType] = useState('quick');
  const [urlTempOptionsCount, setUrlTempOptionsCount] = useState(4);
  const [promptEditorVisible, setPromptEditorVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [editorStyle, setEditorStyle] = useState('auto');
  const [fetchingDetailedPrompt, setFetchingDetailedPrompt] = useState(false);
  const [detailedPromptCache, setDetailedPromptCache] = useState<Record<string, string>>({});

  const effectiveTier = isPersonal ? (user?.tier || 'free') : orgStats.tier;
  const effectivePollsThisMonth = isPersonal ? (user?.pollsThisMonth || 0) : orgStats.pollsThisMonth;
  const monthlyLimit = getMonthlyPollLimit(effectiveTier);
  const pollsLeft = monthlyLimit === Infinity ? '∞' : Math.max(0, monthlyLimit - effectivePollsThisMonth);
  const usagePct = monthlyLimit === Infinity ? 10 : Math.min(100, (effectivePollsThisMonth / monthlyLimit) * 100);
  const canUseTargeting = hasTargeting(effectiveTier);
  const canUseAI = canUseAIPollGeneration(effectiveTier);
  const maxOpts = getMaxOptions(effectiveTier);

  const showToastMessage = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };
  const getAllOptionTexts = () => options.map(o => o.text).filter(t => t.trim());

  // --- Wait for account data before evaluating permissions ---
  useEffect(() => {
    if (accountLoading) return;
    if (!isEditing && !isPersonal && !canCreate) {
      setPermissionError(true);
    } else {
      setPermissionError(false);
    }
  }, [isPersonal, canCreate, isEditing, accountLoading]);

  useEffect(() => {
    if (!isPersonal && orgId) {
      getDoc(doc(db, 'users', orgId)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setOrgStats({ pollsThisMonth: d.pollsThisMonth || 0, tier: d.tier || 'organization', pollsCreated: d.pollsCreated || 0 });
        }
      }).catch(console.error);
    } else {
      setOrgStats({ pollsThisMonth: 0, tier: 'organization', pollsCreated: 0 });
    }
  }, [isPersonal, orgId]);

  useEffect(() => { if (visibility === 'private') setAnonymous(false); }, [visibility]);
  useEffect(() => {
    if (targeting.enabled && anonymous) {
      setAnonymous(false);
      showToastMessage('info', 'Anonymous voting disabled because audience targeting is enabled.');
    }
  }, [targeting.enabled, anonymous]);
  useEffect(() => {
    setIsComparison(type === 'comparison');
    if (type === 'comparison') setMediaChoice('options');
  }, [type]);

  useEffect(() => {
    if (!editId || !user) return;
    getDoc(doc(db, 'polls', editId)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.context?.type === 'personal' && d.creator?.id !== user.uid) { router.push('/dashboard'); return; }
      if (d.context?.type === 'organization' && (!user.memberships?.[d.context.orgId] || !['admin','owner','poll_manager'].includes(user.memberships[d.context.orgId].role))) { router.push('/dashboard'); return; }
      setQuestion(d.question || '');
      setType(d.type || 'quick');
      setVisibility(d.visibility || 'public');
      setAnonymous(d.anonymous || false);
      setCategory(d.category || 'general');
      setTags(d.tags || []);
      if (d.options) setOptions(Object.values(d.options).map((o: any) => ({ id: o.id, text: o.text })));
      if (d.questionMedia) { setQMedia(d.questionMedia.url); setMediaChoice('question'); }
      else if (d.options?.some((o: any) => o.mediaUrl)) {
        setMediaChoice('options');
        const m: Record<string, string> = {};
        d.options.forEach((o: any) => { if (o.mediaUrl) m[o.id] = o.mediaUrl; });
        setOptMedia(m);
      }
      if (d.meta?.targetDemographics && canUseTargeting) {
        setTargeting({
          enabled: true,
          ageRange: d.meta.targetDemographics.ageRange || [18,65],
          genders: d.meta.targetDemographics.genders || [],
          countries: d.meta.targetDemographics.locations || [],
        });
      }
      if (d.type === 'rating' && d.options?.length > 0) setIsMultiOptionRating(true);
      setShowInPublicFeed(d.showInPublicFeed !== undefined ? d.showInPublicFeed : true);
      setIsEditing(true);
    }).catch(console.error);
  }, [editId, user, router, canUseTargeting]);

  const handleTypeChange = (t: string) => {
    setType(t);
    if (t === 'yesno') setOptions([{ id:'yes', text:'Yes' }, { id:'no', text:'No' }]);
    else if (t === 'rating') { if (isMultiOptionRating) setOptions([{ id:'1', text:'' }, { id:'2', text:'' }]); else setOptions([]); }
    else setOptions([{ id:'1', text:'' }, { id:'2', text:'' }]);
  };

  const addOption = () => {
    if (options.length >= maxOpts) { showToastMessage('error', `Max ${maxOpts} options.`); return; }
    setOptions(prev => [...prev, { id: Date.now().toString(), text: '' }]);
  };
  const removeOption = (i: number) => {
    if (options.length <= 2) { showToastMessage('error', 'Min 2 options.'); return; }
    const id = options[i].id;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
    setOptMedia(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const updateOption = (i: number, text: string) => setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, text } : o));

  const openAIOptionsModal = () => {
    if (!canUseAI) { showToastMessage('error', 'AI generation requires Premium.'); return; }
    if (!aiTopic.trim()) { showToastMessage('error', 'Enter a topic first.'); return; }
    let cnt = options.length;
    if (cnt < 2 || type === 'yesno' || type === 'comparison' || type === 'live') cnt = (type === 'yesno' || type === 'comparison' || type === 'live') ? 2 : 4;
    setAiTempOptionsCount(cnt);
    setShowAIOptionsModal(true);
  };
  const handleAIGenerate = async () => {
    setShowAIOptionsModal(false);
    setAiLoading(prev => ({ ...prev, poll: true }));
    try {
      const res = await generatePollSuggestions(aiTopic.trim(), aiTempOptionsCount, type);
      setQuestion(res.question || '');
      if (res.options) {
        let opts = res.options.map((text: string, i: number) => ({ id: i.toString(), text }));
        if (opts.length < aiTempOptionsCount) {
          const fallbacks = ['Another option', 'One more', 'Last option'];
          opts.push(...fallbacks.slice(0, aiTempOptionsCount - opts.length).map((t, idx) => ({ id: (opts.length + idx).toString(), text: t })));
        }
        setOptions(opts);
      }
      showToastMessage('success', 'AI poll generated!');
    } catch { showToastMessage('error', 'AI generation failed.'); }
    finally { setAiLoading(prev => ({ ...prev, poll: false })); }
  };

  const openUrlInputModal = () => {
    if (!canUseAI) { showToastMessage('error', 'AI generation requires Premium.'); return; }
    setPendingUrl('');
    setShowUrlInputModal(true);
  };
  const proceedToUrlOptions = () => {
    if (!pendingUrl.trim()) { showToastMessage('error', 'Enter a URL'); return; }
    setShowUrlInputModal(false);
    setUrlTempOptionsCount(Math.max(options.length, 4));
    setUrlTempType(type);
    setShowUrlOptionsModal(true);
  };
  const handleGenerateFromURL = async () => {
    setShowUrlOptionsModal(false);
    setAiLoading(prev => ({ ...prev, poll: true }));
    try {
      const res = await generatePollFromURL(pendingUrl, urlTempOptionsCount, urlTempType);
      setQuestion(res.question || '');
      setOptions((res.options || []).map((t: string, i: number) => ({ id: i.toString(), text: t })));
      if (urlTempType !== type) { setType(urlTempType); if (urlTempType === 'yesno') setOptions([{ id:'yes', text:'Yes' }, { id:'no', text:'No' }]); }
      showToastMessage('success', 'Poll generated from URL!');
    } catch (err) { showToastMessage('error', (err as Error).message || 'Failed to generate from URL'); }
    finally { setAiLoading(prev => ({ ...prev, poll: false })); setPendingUrl(''); }
  };

  const openPromptEditor = async (target: any) => {
    if (!canUseAI) { showToastMessage('error', 'AI image generation requires Premium.'); return; }
    const subject = target.type === 'question' ? question : target.optionText;
    if (!subject?.trim()) { showToastMessage('error', 'Enter text first.'); return; }
    const cacheKey = target.type === 'question' ? 'question' : `option_${target.optionId}`;
    setEditingTarget(target);
    setPromptEditorVisible(true);
    setFetchingDetailedPrompt(true);
    if (detailedPromptCache[cacheKey]) {
      setEditingPrompt(detailedPromptCache[cacheKey]);
      setOriginalPrompt(detailedPromptCache[cacheKey]);
      setEditorStyle(selectedImageStyle);
      setFetchingDetailedPrompt(false);
      return;
    }
    try {
      const detailed = await getDetailedPrompt(
        subject,
        target.type === 'question' ? 'poll_question' : 'poll_option',
        selectedImageStyle,
        question,
        getAllOptionTexts(),
        target.type === 'option' ? target.index : undefined,
        target.type === 'option' ? target.total : undefined,
        type
      );
      setEditingPrompt(detailed);
      setOriginalPrompt(detailed);
      setEditorStyle(selectedImageStyle);
      setDetailedPromptCache(prev => ({ ...prev, [cacheKey]: detailed }));
    } catch { setEditingPrompt(subject); setOriginalPrompt(subject); showToastMessage('error', 'Using raw text as prompt.'); }
    finally { setFetchingDetailedPrompt(false); }
  };

  const confirmImageGeneration = async () => {
    if (!editingTarget) return;
    const target = editingTarget;
    setPromptEditorVisible(false);
    if (target.type === 'question') setAiLoading(prev => ({ ...prev, question: true }));
    else setGeneratingImageForOptions(prev => ({ ...prev, [target.optionId]: true }));
    try {
      const allOpts = getAllOptionTexts();
      const isCustom = editingPrompt !== originalPrompt;
      const url = await generateAndUploadImage(
        editingPrompt,
        `polls/${user?.uid}/${target.type === 'question' ? 'questions' : 'options'}`,
        target.type === 'question' ? 'poll_question' : 'poll_option',
        editorStyle,
        question,
        allOpts,
        target.type === 'option' ? target.index : undefined,
        target.type === 'option' ? target.total : allOpts.length,
        type,
        isCustom
      );
      if (target.type === 'question') {
        setQMedia(url);
        setQuestionImageKey(prev => prev + 1);
        setMediaChoice('question');
        showToastMessage('success', 'Question image generated!');
      } else {
        setOptMedia(prev => ({ ...prev, [target.optionId]: url }));
        setOptionImageKeys(prev => ({ ...prev, [target.optionId]: (prev[target.optionId] || 0) + 1 }));
        showToastMessage('success', 'Option image generated!');
      }
    } catch (err) { showToastMessage('error', (err as Error).message || 'Image generation failed.'); }
    finally {
      if (target.type === 'question') setAiLoading(prev => ({ ...prev, question: false }));
      else setGeneratingImageForOptions(prev => ({ ...prev, [target.optionId]: false }));
    }
  };

  const uploadFile = async (dataUrl: string, folder: string) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    const path = `${folder}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const validate = () => {
    if (!question.trim()) { showToastMessage('error', 'Question is required.'); return false; }
    if (question.length > MAX_TITLE_LENGTH) { showToastMessage('error', `Question too long (max ${MAX_TITLE_LENGTH}).`); return false; }
    if (type === 'rating') {
      if (ratingScale.min >= ratingScale.max) { showToastMessage('error', 'Min must be less than Max.'); return false; }
      if (isMultiOptionRating && options.filter(o => o.text.trim()).length < 2) { showToastMessage('error', 'At least 2 items required.'); return false; }
      return true;
    }
    if (type !== 'yesno' && options.filter(o => o.text.trim()).length < 2) { showToastMessage('error', 'At least 2 options required.'); return false; }
    if (type === 'comparison' && options.some(opt => opt.text.trim() && !optMedia[opt.id])) { showToastMessage('error', 'All comparison options need an image.'); return false; }
    return true;
  };

  const handlePublish = async () => {
    if (!validate()) return;
    if (!isEditing && !isPersonal && !canCreate) { showToastMessage('error', 'No permission to create polls here.'); return; }
    if (!isEditing && monthlyLimit !== Infinity && effectivePollsThisMonth >= monthlyLimit) { showToastMessage('error', 'Monthly limit reached. Upgrade for more.'); return; }
    setPublishing(true);
    setProgress(10);
    try {
      let qMediaUrl: string | null = null;
      let optsWithMedia = options;
      if (mediaChoice === 'question' && qMedia) {
        setProgress(25);
        qMediaUrl = qMedia.startsWith('blob:') ? await uploadFile(qMedia, `polls/${user?.uid}/questions`) : qMedia;
      } else if (mediaChoice === 'options') {
        setProgress(25);
        optsWithMedia = await Promise.all(options.filter(o => o.text.trim()).map(async opt => {
          if (optMedia[opt.id]?.startsWith('blob:')) return { ...opt, mediaUrl: await uploadFile(optMedia[opt.id], `polls/${user?.uid}/options`) };
          if (optMedia[opt.id]) return { ...opt, mediaUrl: optMedia[opt.id] };
          return opt;
        }));
      }
      setProgress(50);
      const endsAt = durationMs ? Timestamp.fromDate(new Date(Date.now() + durationMs)) : null;
      const accessCode = visibility === 'private' && !isEditing ? Math.random().toString(36).slice(2, 8).toUpperCase() : undefined;
      const finalCat = category === 'other' ? (customCat.trim() || 'other') : category;
      const meta: any = { isPremium: effectiveTier === 'premium' || effectiveTier === 'organization', isVerified: user?.verified || false, isLive: type === 'live' };
      if (targeting.enabled && canUseTargeting) {
        meta.targetDemographics = { ageRange: targeting.ageRange, genders: targeting.genders, locations: targeting.countries };
      }

      const pollData = cleanObject({
        question: question.trim(),
        type,
        visibility,
        anonymous: visibility !== 'private' && anonymous,
        category: finalCat,
        tags,
        creator: {
          id: user?.uid,
          name: user?.name || 'Anonymous',
          username: user?.username || null,
          type: user?.type || 'individual',
          verified: user?.verified || false,
          profileImage: user?.profileImage || null,
          tier: effectiveTier,
          contextType,
          orgId: orgId || null,
          orgRole: orgRole || null,
        },
        context: { type: contextType, orgId: orgId || null },
        endsAt,
        totalVotes: isEditing ? undefined : 0,
        totalViews: isEditing ? undefined : 0,
        accessCode: accessCode || null,
        questionMedia: qMediaUrl ? { url: qMediaUrl, type: 'image' } : null,
        meta,
        allowedDomains: domainRestr.enabled && user?.type === 'organization' ? domainRestr.domains.split(',').map((d: string) => d.trim()).filter(Boolean) : null,
        showInPublicFeed: visibility === 'private' ? false : showInPublicFeed,
        ...(type === 'rating' ? { scale: ratingScale, options: isMultiOptionRating ? optsWithMedia : [], isMultiOptionRating } : { options: optsWithMedia }),
      });

      if (scheduleEnabled && effectiveTier === 'premium' && !isEditing) {
        if (!scheduledStart) { showToastMessage('error', 'Set a start date/time.'); setPublishing(false); return; }
        pollData.status = 'scheduled';
        pollData.scheduledStart = Timestamp.fromDate(new Date(scheduledStart));
        if (scheduledEnd) pollData.scheduledEnd = Timestamp.fromDate(new Date(scheduledEnd));
        pollData.createdAt = null;
      } else {
        pollData.status = 'active';
        pollData.createdAt = serverTimestamp();
      }

      if (isEditing) {
        await updateDoc(doc(db, 'polls', editId!), { ...pollData, updatedAt: serverTimestamp() });
        showToastMessage('success', 'Poll updated!');
        router.push(`/poll/${editId}`);
      } else {
        const pollRef = await addDoc(collection(db, 'polls'), pollData);
        await updateDoc(doc(db, 'users', user!.uid), { pollsThisMonth: increment(1), pollsCreated: increment(1), updatedAt: serverTimestamp() });
        if (contextType === 'organization' && orgId) {
          await updateDoc(doc(db, 'users', orgId), { pollsThisMonth: increment(1), pollsCreated: increment(1), updatedAt: serverTimestamp() });
          setOrgStats(prev => ({ ...prev, pollsThisMonth: prev.pollsThisMonth + 1, pollsCreated: prev.pollsCreated + 1 }));
        }
        await refreshUser();
        setProgress(100);
        showToastMessage('success', visibility === 'private' && accessCode ? `Published! Code: ${accessCode}` : 'Poll published!');
        router.push(`/poll/${pollRef.id}`);
      }
    } catch (err) { console.error(err); showToastMessage('error', (err as Error).message || 'Failed to publish.'); }
    finally { setPublishing(false); setProgress(0); }
  };

  const inputCls = `w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/12 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/20 transition`;
  const textareaCls = `w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/12 rounded-xl p-3 text-sm font-semibold text-gray-800 dark:text-gray-200 resize-y min-h-[80px] outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/20 transition`;
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5';

  const renderTargeting = () => {
    if (!canUseTargeting) return null;
    return (
      <FormCard>
        <SectionTitle>🎯 Audience Targeting</SectionTitle>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 m-0">Target specific audience</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Show this poll only to selected demographics</p>
          </div>
          <Toggle value={targeting.enabled} onChange={v => setTargeting(prev => ({ ...prev, enabled: v }))} disabled={anonymous && !targeting.enabled} disabledReason={anonymous ? 'Turn off anonymous voting first' : ''} />
        </div>
        {targeting.enabled && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/8 space-y-4">
            <div>
              <label className={labelCls}>Age range</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={targeting.ageRange[0]} onChange={e => setTargeting(prev => ({ ...prev, ageRange: [parseInt(e.target.value) || 18, prev.ageRange[1]] }))} className={`w-20 ${inputCls}`} />
                <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
                <input type="number" value={targeting.ageRange[1]} onChange={e => setTargeting(prev => ({ ...prev, ageRange: [prev.ageRange[0], parseInt(e.target.value) || 65] }))} className={`w-20 ${inputCls}`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Genders</label>
              <div className="flex gap-4">
                {['Male','Female','Other'].map(g => (
                  <label key={g} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={targeting.genders.includes(g)} onChange={e => { if (e.target.checked) setTargeting(prev => ({ ...prev, genders: [...prev.genders, g] })); else setTargeting(prev => ({ ...prev, genders: prev.genders.filter(x => x !== g) })); }} />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Countries</label>
              <button onClick={() => { setCountrySearch(''); setShowCountryPicker(true); }} className={`w-full text-left ${inputCls} cursor-pointer`}>
                {targeting.countries.length === 0 ? 'Select countries' : `${targeting.countries.length} country(s) selected`}
              </button>
              {targeting.countries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {targeting.countries.map((code: string) => {
                    const c = COUNTRIES.find(c => c.code === code);
                    return (
                      <span key={code} className="bg-primary/10 dark:bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1">
                        {c?.name || code}
                        <button onClick={() => setTargeting(prev => ({ ...prev, countries: prev.countries.filter(c => c !== code) }))} className="border-none bg-transparent cursor-pointer text-red-500 dark:text-red-400 text-sm leading-none">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </FormCard>
    );
  };

  const renderSidebarSettings = () => (
    <>
      <FormCard>
        <SectionTitle>Poll Settings</SectionTitle>
        <div className="mb-3">
          <label className={labelCls}>Visibility</label>
          <select className={selectCls} value={visibility} onChange={e => setVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map(v => (
              <option key={v.value} value={v.value} disabled={!canUseVisibility(effectiveTier, v.value)}>
                {v.label}{!canUseVisibility(effectiveTier, v.value) ? ' (Premium)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className={labelCls}>Duration</label>
          <select className={selectCls} value={durationMs ?? ''} onChange={e => setDurationMs(e.target.value ? parseInt(e.target.value) : null)}>
            {DURATION_OPTIONS.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
          </select>
        </div>
        {visibility !== 'private' && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/8">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 m-0">Anonymous voting</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Hide voter identities</p>
            </div>
            <Toggle value={anonymous} onChange={v => setAnonymous(v)} disabled={targeting.enabled} disabledReason={targeting.enabled ? 'Disabled with targeting' : ''} />
          </div>
        )}
        {visibility !== 'private' && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/8">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 m-0">Show in public feed</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Appear in Explore and search results</p>
            </div>
            <Toggle value={showInPublicFeed} onChange={setShowInPublicFeed} disabled={false} />
          </div>
        )}
      </FormCard>

      {renderTargeting()}

      <FormCard>
        <SectionTitle>Monthly Usage</SectionTitle>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{effectivePollsThisMonth} used</span>
          <span>{monthlyLimit === Infinity ? '∞' : monthlyLimit} total</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full ${usagePct >= 90 ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-secondary'}`} style={{ width: `${usagePct}%` }} />
        </div>
        <p className={`text-[11px] ${pollsLeft === '∞' ? 'text-gray-400 dark:text-gray-500' : pollsLeft <= 0 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
          {pollsLeft === '∞' ? 'Unlimited polls' : pollsLeft <= 0 ? 'Limit reached — ' : `${pollsLeft} polls remaining · `}
          {effectiveTier === 'free' && <Link href="/upgrade" className="text-primary font-semibold">Upgrade for more</Link>}
        </p>
      </FormCard>

      {effectiveTier === 'free' && (
        <div className="bg-gradient-to-br from-indigo-50 dark:from-primary/10 to-purple-50 dark:to-secondary/10 border border-primary/20 dark:border-primary/25 rounded-2xl p-4 text-center">
          <p className="text-2xl">⭐</p>
          <p className="text-sm font-extrabold text-indigo-800 dark:text-[#f0f0ff] mt-2 mb-1">Unlock Premium</p>
          <p className="text-xs text-purple-700 dark:text-gray-400 mb-3 leading-relaxed">Unlimited polls, AI images, targeting, private polls & advanced analytics.</p>
          <Link href="/upgrade" className="block bg-gradient-to-r from-primary to-secondary text-white rounded-xl py-2 text-sm font-bold shadow hover:shadow-md hover:opacity-90 transition">Upgrade Now →</Link>
        </div>
      )}
    </>
  );

  // Show loading while account data is being fetched
  if (accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#08091a]">
      <p className="text-lg font-bold text-gray-900 dark:text-[#f0f0ff]">Sign in to create polls</p>
      <Link href="/login" className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl px-6 py-3 font-semibold shadow hover:shadow-md transition">Sign in</Link>
    </div>
  );
  if (permissionError) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="bg-white dark:bg-[#0f1120] rounded-2xl p-8 text-center max-w-md border border-gray-100 dark:border-white/8">
        <p className="text-5xl mb-3">🔒</p>
        <p className="text-xl font-bold text-gray-800 dark:text-[#f0f0ff] mb-2">Permission Denied</p>
        <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have permission to create polls for this organization.</p>
        <Link href="/dashboard" className="text-primary underline">Go to Dashboard</Link>
      </div>
    </div>
  );

  const showOptions = type !== 'yesno' && (type !== 'rating' || isMultiOptionRating);
  const showOptImg = type === 'comparison' || type === 'live' || (mediaChoice === 'options' && showOptions);
  const showQuestionMedia = mediaChoice === 'question' && !isComparison;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-fade-up">
          <div className={`rounded-xl px-4 py-3 shadow-lg ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-400/12 border border-green-200 dark:border-green-400/25 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-400/12 border border-red-200 dark:border-red-400/25 text-red-800 dark:text-red-300'}`}>
            {toast.msg}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-7 lg:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff] m-0">
            {isEditing ? 'Edit Poll' : 'Create a New Poll'}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {isEditing ? 'Update your poll details below.' : 'Fill in the details, or let AI generate a poll for you.'}
          </p>
          {!isPersonal && activeOrg && <p className="text-xs text-primary mt-1">Creating poll for <strong>{activeOrg.name}</strong> (organization)</p>}
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left form */}
          <div className="flex-1">
            {/* AI Generator */}
            <FormCard>
              <SectionTitle>🤖 AI Generate (Optional)</SectionTitle>
              <div className="flex flex-wrap gap-2 mb-2">
                <input className={`flex-1 ${inputCls}`} placeholder="e.g. remote work trends 2026…" value={aiTopic} onChange={e => setAiTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && openAIOptionsModal()} />
                <button onClick={openAIOptionsModal} disabled={aiLoading.poll} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition ${aiLoading.poll ? 'bg-gray-200 dark:bg-white/8 text-gray-500 dark:text-gray-400' : 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:shadow hover:opacity-90'}`}>
                  {aiLoading.poll ? <><div className="w-3.5 h-3.5 border-2 border-gray-500 dark:border-gray-400 border-t-transparent rounded-full animate-spin" />Generating</> : '🤖 Generate'}
                </button>
                <button onClick={openUrlInputModal} disabled={aiLoading.poll} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${aiLoading.poll ? 'bg-gray-200 dark:bg-white/8 text-gray-500 dark:text-gray-400' : 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:shadow hover:opacity-90'}`}>
                  🔗 From URL
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Image Style:</span>
                <select value={selectedImageStyle} onChange={e => setSelectedImageStyle(e.target.value)} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/12 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 text-xs outline-none">
                  {['auto','photorealistic','illustration','cinematic','abstract','vintage'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Applies to all AI images</span>
              </div>
              {!canUseAI && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">AI generation requires Premium. <Link href="/upgrade" className="text-primary font-semibold">Upgrade →</Link></p>}
            </FormCard>

            {/* Poll Type */}
            <FormCard>
              <SectionTitle>Poll Type</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                {POLL_TYPES.map(pt => {
                  const allowed = canCreatePollType(effectiveTier, pt.value);
                  const selected = type === pt.value;
                  return (
                    <button
                      key={pt.value}
                      onClick={() => allowed && handleTypeChange(pt.value)}
                      className={`border rounded-xl py-3 text-center transition ${
                        selected ? 'border-primary bg-primary/8 dark:bg-primary/12' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 hover:border-primary/40'
                      } ${allowed ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="text-xl mb-1">{POLL_TYPE_ICONS[pt.value as PollTypeKey]}</div>
                      <div className={`text-[11px] font-bold ${selected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>{pt.label}</div>
                      {!allowed && <div className="text-[9px] text-secondary font-semibold mt-1">Premium</div>}
                    </button>
                  );
                })}
              </div>
            </FormCard>

            {/* Question */}
            <FormCard>
              <SectionTitle>Poll Question *</SectionTitle>
              <textarea className={textareaCls} placeholder="What would you like to ask?" value={question} onChange={e => setQuestion(e.target.value)} maxLength={MAX_TITLE_LENGTH} />
              <div className="flex justify-between mt-1.5">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Be clear and concise</p>
                <p className={`text-[11px] ${question.length > MAX_TITLE_LENGTH * 0.9 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>{question.length}/{MAX_TITLE_LENGTH}</p>
              </div>
            </FormCard>

            {/* Media placement */}
            {!isComparison && (
              <FormCard>
                <SectionTitle>Media placement</SectionTitle>
                <div className="flex gap-4">
                  {[{val:'question',label:'Question image'},{val:'options',label:'Option images'}].map(m => (
                    <label key={m.val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="radio" name="mediaChoice" value={m.val} checked={mediaChoice === m.val} onChange={() => setMediaChoice(m.val)} className="accent-primary" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </FormCard>
            )}

            {/* Question media */}
            {showQuestionMedia && (
              <FormCard>
                <SectionTitle>Question image</SectionTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <MediaPicker key={questionImageKey} onPicked={setQMedia} currentImage={qMedia} />
                  {canUseAI && <AiImageButton onGenerate={() => openPromptEditor({ type: 'question' })} loading={aiLoading.question} disabled={!question.trim()} label="Generate with AI" />}
                </div>
              </FormCard>
            )}

            {/* Rating config */}
            {type === 'rating' && (
              <FormCard>
                <div className="flex justify-between items-center mb-3">
                  <SectionTitle>Rating Configuration</SectionTitle>
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    <span>Rate multiple items</span>
                    <input type="checkbox" checked={isMultiOptionRating} onChange={e => { setIsMultiOptionRating(e.target.checked); if (e.target.checked && options.length === 0) setOptions([{ id:'1', text:'' }, { id:'2', text:'' }]); else if (!e.target.checked) setOptions([]); }} className="accent-primary" />
                  </label>
                </div>
                <div className="mb-4">
                  <label className={labelCls}>Rating Scale</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{l:'Min',k:'min'},{l:'Max',k:'max'},{l:'Step',k:'step'}].map(f => (
                      <div key={f.k}>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">{f.l}</label>
                        <input type="number" className={inputCls} value={ratingScale[f.k as keyof typeof ratingScale]} onChange={e => setRatingScale(prev => ({ ...prev, [f.k]: Math.max(f.k === 'step' ? 0.1 : 1, parseFloat(e.target.value) || 1) }))} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Example: 1–5 step 1 → 1,2,3,4,5</p>
                </div>
                {isMultiOptionRating && (
                  <div>
                    <SectionTitle>Items to Rate</SectionTitle>
                    <div className="space-y-2">
                      {options.map((opt, i) => (
                        <div key={opt.id}>
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 min-w-[20px]">{i+1}.</span>
                            <input className={`flex-1 ${inputCls}`} placeholder={`Item ${i+1}…`} value={opt.text} onChange={e => updateOption(i, e.target.value)} maxLength={MAX_OPTION_LENGTH} />
                            {options.length > 2 && <button onClick={() => removeOption(i)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/25 text-red-500 dark:text-red-400 flex items-center justify-center">✕</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {options.length < maxOpts && <button onClick={addOption} className="mt-3 w-full border border-dashed border-primary/30 dark:border-primary/25 rounded-lg py-2 text-primary text-sm font-semibold hover:bg-primary/5 dark:hover:bg-primary/8 transition">+ Add item</button>}
                  </div>
                )}
              </FormCard>
            )}

            {/* Answer options */}
            {showOptions && (
              <FormCard>
                <SectionTitle>Answer Options ({options.length}/{maxOpts})</SectionTitle>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={opt.id}>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 min-w-[20px]">{i+1}.</span>
                        <input className={`flex-1 ${inputCls} ${opt.text ? 'border-primary/30 dark:border-primary/25' : ''}`} placeholder={`Option ${i+1}…`} value={opt.text} onChange={e => updateOption(i, e.target.value)} maxLength={MAX_OPTION_LENGTH} />
                        {options.length > 2 && <button onClick={() => removeOption(i)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/25 text-red-500 dark:text-red-400 flex items-center justify-center">✕</button>}
                      </div>
                      {showOptImg && (
                        <div className="mt-2 ml-7">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Option image {type === 'comparison' ? '(required)' : '(optional)'}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <MediaPicker key={optionImageKeys[opt.id] || 0} onPicked={(url) => {
                              if (typeof url === 'string') {
                                setOptMedia(prev => ({ ...prev, [opt.id]: url }));
                              }
                            }} currentImage={optMedia[opt.id]} />
                            {canUseAI && <AiImageButton onGenerate={() => openPromptEditor({ type:'option', optionId:opt.id, optionText:opt.text, index:i, total:options.length })} loading={!!generatingImageForOptions[opt.id]} disabled={!opt.text.trim()} label="Generate with AI" />}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < maxOpts && <button onClick={addOption} className="mt-3 w-full border border-dashed border-primary/30 dark:border-primary/25 rounded-lg py-2 text-primary text-sm font-semibold hover:bg-primary/5 dark:hover:bg-primary/8 transition">+ Add option</button>}
              </FormCard>
            )}

            {/* Category & Tags */}
            <FormCard>
              <SectionTitle>Category & Tags</SectionTitle>
              <label className={labelCls}>Category</label>
              <select className={`${selectCls} mb-3`} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {category === 'other' && <input className={`${inputCls} mb-3`} placeholder="Enter custom category" value={customCat} onChange={e => setCustomCat(e.target.value)} />}
              <label className={labelCls}>Tags (max {MAX_TAGS})</label>
              <TagInput tags={tags} onChangeTags={setTags} maxTags={MAX_TAGS} />
            </FormCard>

            {/* Scheduling */}
            {effectiveTier === 'premium' && !isEditing && (isPersonal || canScheduleOrgPoll) && (
              <FormCard>
                <SectionTitle>📅 Scheduling</SectionTitle>
                <div className="flex items-center justify-between mb-3">
                  <div><p className="text-sm font-semibold text-gray-800 dark:text-gray-200 m-0">Schedule for later</p><p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Auto-publish at specified time</p></div>
                  <Toggle value={scheduleEnabled} onChange={setScheduleEnabled} />
                </div>
                {scheduleEnabled && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/8 space-y-3">
                    <div><label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Start date & time *</label><input type="datetime-local" className={inputCls} value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} /></div>
                    <div><label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">End date (optional)</label><input type="datetime-local" className={inputCls} value={scheduledEnd} onChange={e => setScheduledEnd(e.target.value)} /></div>
                  </div>
                )}
              </FormCard>
            )}

            {/* Mobile sidebar */}
            <div className="lg:hidden">{renderSidebarSettings()}</div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="bg-white dark:bg-[#0f1120] border border-gray-100 dark:border-white/8 rounded-2xl p-4 mb-4">
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-semibold mb-2"><span>Publishing…</span><span>{progress}%</span></div>
                <div className="h-1.5 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-xl py-3.5 text-base font-extrabold shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {publishing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publishing…</> : isEditing ? 'Update Poll' : scheduleEnabled ? 'Schedule Poll' : 'Publish Poll'}
            </button>
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2">⚡ Instant — your poll goes live immediately</p>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start space-y-4 lg:w-72">
            {renderSidebarSettings()}
          </div>
        </div>
      </div>

      {/* Modals – unchanged except for label text */}
      {showAIOptionsModal && (
        <Modal onClose={() => setShowAIOptionsModal(false)}>
          <h3 className="text-xl font-extrabold text-center mb-4 text-gray-900 dark:text-[#f0f0ff]">AI Poll Generation</h3>
          <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">Topic: <strong>{aiTopic}</strong></p>
          <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">Poll type: <strong>{POLL_TYPES.find(t => t.value === type)?.label}</strong></p>
          <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Number of options (2-6):</label>
          <input type="number" min="2" max="6" value={aiTempOptionsCount} onChange={e => setAiTempOptionsCount(Math.min(6, Math.max(2, parseInt(e.target.value) || 2)))} className={`${inputCls} mb-5`} />
          <div className="flex gap-2">
            <button onClick={() => setShowAIOptionsModal(false)} className="flex-1 border border-gray-300 dark:border-white/15 bg-white dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/8 transition">Cancel</button>
            <button onClick={handleAIGenerate} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition">Generate</button>
          </div>
        </Modal>
      )}

      {showUrlInputModal && (
        <Modal onClose={() => setShowUrlInputModal(false)}>
          <h3 className="text-xl font-extrabold text-center mb-4 text-gray-900 dark:text-[#f0f0ff]">Generate Poll from URL</h3>
          <input type="url" placeholder="https://example.com/article" value={pendingUrl} onChange={e => setPendingUrl(e.target.value)} className={`${inputCls} mb-5`} />
          <div className="flex gap-2">
            <button onClick={() => setShowUrlInputModal(false)} className="flex-1 border border-gray-300 dark:border-white/15 bg-white dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/8 transition">Cancel</button>
            <button onClick={proceedToUrlOptions} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition">Next</button>
          </div>
        </Modal>
      )}

      {showUrlOptionsModal && (
        <Modal onClose={() => setShowUrlOptionsModal(false)}>
          <h3 className="text-xl font-extrabold text-center mb-4 text-gray-900 dark:text-[#f0f0ff]">Configure Poll</h3>
          <p className="text-sm mb-2 break-all text-gray-600 dark:text-gray-400">URL: <strong className="text-gray-800 dark:text-gray-200">{pendingUrl.substring(0,60)}…</strong></p>
          <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Poll type:</label>
          <select value={urlTempType} onChange={e => setUrlTempType(e.target.value)} className={`${selectCls} mb-4`}>{POLL_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}</select>
          <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Options (2-6):</label>
          <input type="number" min="2" max="6" value={urlTempOptionsCount} onChange={e => setUrlTempOptionsCount(Math.min(6, Math.max(2, parseInt(e.target.value) || 2)))} className={`${inputCls} mb-5`} />
          <div className="flex gap-2">
            <button onClick={() => setShowUrlOptionsModal(false)} className="flex-1 border border-gray-300 dark:border-white/15 bg-white dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/8 transition">Back</button>
            <button onClick={handleGenerateFromURL} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition">Generate</button>
          </div>
        </Modal>
      )}

      {promptEditorVisible && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-extrabold text-center mb-2 text-gray-900 dark:text-[#f0f0ff]">✏️ Edit Image Prompt</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">Modify the prompt to add specific details or style preferences.</p>
            {fetchingDetailedPrompt ? (
              <div className="text-center py-10"><div className="w-8 h-8 border-3 border-gray-200 dark:border-white/15 border-t-primary rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-500 dark:text-gray-400">Generating detailed prompt…</p></div>
            ) : (
              <>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Image prompt:</label>
                <textarea value={editingPrompt} onChange={e => setEditingPrompt(e.target.value)} rows={5} className={`${textareaCls} mb-4`}/>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Image Style:</label>
                <select value={editorStyle} onChange={e => setEditorStyle(e.target.value)} className={`${selectCls} mb-5`}>
                  {['auto','photorealistic','illustration','cinematic','abstract','vintage'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setPromptEditorVisible(false)} className="flex-1 border border-gray-300 dark:border-white/15 bg-white dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/8 transition">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!editingTarget) return;
                      const key = editingTarget.type === 'question' ? 'question' : `option_${editingTarget.optionId}`;
                      setDetailedPromptCache(prev => { const n = { ...prev }; delete n[key]; return n; });
                      setFetchingDetailedPrompt(true);
                      try {
                        const d = await getDetailedPrompt(
                          editingTarget.type === 'question' ? question : editingTarget.optionText,
                          editingTarget.type === 'question' ? 'poll_question' : 'poll_option',
                          editorStyle,
                          question,
                          getAllOptionTexts(),
                          editingTarget.type === 'option' ? editingTarget.index : undefined,
                          editingTarget.type === 'option' ? editingTarget.total : undefined,
                          type
                        );
                        setEditingPrompt(d);
                        setOriginalPrompt(d);
                        setDetailedPromptCache(prev => ({ ...prev, [key]: d }));
                      } catch { showToastMessage('error', 'Failed to regenerate prompt'); }
                      finally { setFetchingDetailedPrompt(false); }
                    }}
                    className="bg-primary/10 dark:bg-primary/15 text-primary rounded-lg py-2 text-sm font-semibold px-3 cursor-pointer hover:bg-primary/20 transition"
                  >🔄 Regenerate</button>
                  <button onClick={confirmImageGeneration} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition">Generate Image</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCountryPicker && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-auto border border-gray-100 dark:border-white/10 shadow-2xl">
            <h3 className="text-xl font-extrabold mb-4 text-gray-900 dark:text-[#f0f0ff]">Select Countries</h3>
            <input type="text" placeholder="Search…" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} className={`${inputCls} mb-4`}/>
            <div className="space-y-2">
              {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                <label key={country.code} className="flex items-center gap-2 py-1 cursor-pointer text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={targeting.countries.includes(country.code)} onChange={() => {
                    if (targeting.countries.includes(country.code)) setTargeting(prev => ({ ...prev, countries: prev.countries.filter(c => c !== country.code) }));
                    else setTargeting(prev => ({ ...prev, countries: [...prev.countries, country.code] }));
                  }} className="accent-primary" />
                  {country.name}
                </label>
              ))}
            </div>
            <button onClick={() => setShowCountryPicker(false)} className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 mt-5 font-bold hover:opacity-90 transition">Done</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);} }
        .animate-fade-up{animation:fade-up 0.2s ease-out;}
      `}</style>
    </div>
  );
}

// Default export with Suspense boundary
export default function CreatePollPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreatePollContent />
    </Suspense>
  );
}