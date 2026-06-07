'use client';

import { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'premium' | 'success';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  icon = null,
  type = 'button',
  size = 'medium',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-xl';
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-5 py-2.5 text-base',
    large: 'px-6 py-3 text-lg',
  };
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg',
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-gray-500 hover:bg-gray-100',
    premium: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md',
    success: 'bg-green-500 text-white hover:bg-green-600',
  };
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  const variantClass = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizeClass} ${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {icon && !loading && <span className="inline-flex">{icon}</span>}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Title({ children, className = '' }: TitleProps) {
  return <h1 className={`text-3xl font-bold text-gray-900 ${className}`}>{children}</h1>;
}

export function Subtitle({ children, className = '' }: TitleProps) {
  return <p className={`text-gray-500 text-lg ${className}`}>{children}</p>;
}

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 16, className = '' }: VerifiedBadgeProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-primary text-white rounded-full font-bold shadow-sm ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.75 }}
    >
      ✓
    </div>
  );
}

export function PremiumBadge({ size = 20, className = '' }: VerifiedBadgeProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-md ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.6 }}
    >
      ⭐
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  className?: string;
}

export function FilterChip({ label, active = false, onPress, className = '' }: FilterChipProps) {
  return (
    <button
      onClick={onPress}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    >
      {label}
    </button>
  );
}

interface FeatureLockProps {
  featureName: string;
  onUpgrade: () => void;
  className?: string;
}

export function FeatureLock({ featureName, onUpgrade, className = '' }: FeatureLockProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
        <span className="text-lg">🔒</span>
        <span className="font-semibold">{featureName} is a Premium feature</span>
      </div>
      <Button onClick={onUpgrade} variant="premium" size="small">
        Upgrade to Premium
      </Button>
    </div>
  );
}

interface PollOptionProps {
  option: any;
  selected: boolean;
  onSelect: () => void;
  totalVotes: number;
  disabled?: boolean;
  showResults?: boolean;
}

export function PollOption({ option, selected, onSelect, totalVotes, disabled = false, showResults = false }: PollOptionProps) {
  const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;
  return (
    <div className="mb-3">
      <label
        className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${
          selected ? 'border-primary bg-primary/5' : 'border-gray-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3">
          {!showResults && (
            <input
              type="radio"
              name="poll-option"
              checked={selected}
              onChange={onSelect}
              disabled={disabled}
              className="w-4 h-4 text-primary"
            />
          )}
          <span className="text-gray-800">{option.text}</span>
        </div>
        {showResults && <span className="text-sm font-semibold text-primary">{Math.round(percentage)}%</span>}
      </label>
      {showResults && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: any;
  onPress?: () => void;
  className?: string;
}

export function UserCard({ user, onPress, className = '' }: UserCardProps) {
  return (
    <div
      onClick={onPress}
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
        {user.profileImage ? (
          <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          user.name?.[0] || 'U'
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{user.name || 'Anonymous'}</p>
        <p className="text-xs text-gray-500">@{user.username || 'user'}</p>
        <div className="flex gap-3 text-xs text-gray-400 mt-1">
          <span>{user.followersCount || 0} followers</span>
          <span>{user.pollsCreated || 0} polls</span>
        </div>
      </div>
      {user.verified && <VerifiedBadge size={16} />}
      {user.tier === 'premium' && <PremiumBadge size={16} />}
    </div>
  );
}

interface AccessCodeInputProps {
  value: string;
  onChangeText: (val: string) => void;
  onSubmit: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AccessCodeInput({ value, onChangeText, onSubmit, placeholder = 'Enter access code', disabled = false, className = '' }: AccessCodeInputProps) {
  return (
    <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-2 outline-none"
      />
      <button
        onClick={() => onSubmit(value)}
        disabled={disabled}
        className="bg-primary/10 px-4 py-2 text-primary hover:bg-primary/20 transition"
      >
        🔑
      </button>
    </div>
  );
}

interface PollResultBarProps {
  percent: number;
  label?: string;
  color?: string;
  className?: string;
}

export function PollResultBar({ percent, label, color = '#6ef3ff', className = '' }: PollResultBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700">{label}</span>
          <span className="font-semibold text-primary">{Math.round(safePercent)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${safePercent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface TagInputProps {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChangeTags, placeholder = 'Add tags...', maxTags = 5 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChangeTags([...tags, tag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChangeTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-lg focus-within:border-primary">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
            {tag}
            <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500">×</button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAddTag()}
            onBlur={handleAddTag}
            placeholder={placeholder}
            className="flex-1 min-w-[100px] outline-none text-sm"
          />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">{tags.length}/{maxTags} tags</p>
    </div>
  );
}