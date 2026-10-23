import React, { useState } from 'react';

/**
 * Extract 1 or 2 uppercase initials from a full name.
 * e.g. "muhammad iftah" -> "MI", "Uqbah" -> "UQ", "Ahmad" -> "AH"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Pick a consistent, attractive Tailwind color gradient based on name hash.
 */
export function getAvatarColorClass(name) {
  const palettes = [
    'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sky-500/20',
    'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/20',
    'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/20',
    'bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-violet-500/20',
    'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-500/20',
    'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-500/20',
    'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/20',
    'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-500/20',
    'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-cyan-500/20',
    'bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-fuchsia-500/20'
  ];

  if (!name) return palettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

export default function InitialsAvatar({ 
  name = '', 
  src = null, 
  className = 'w-10 h-10 text-xs', 
  rounded = 'rounded-2xl',
  forceInitials = false
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);
  const colorClass = getAvatarColorClass(name);

  // If forceInitials is true, or image failed, or src is empty/null/unsplash dummy -> render initials
  const shouldRenderInitials = forceInitials || imgFailed || !src || src.includes('unsplash.com');

  if (!shouldRenderInitials && src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgFailed(true)}
        className={`${className} ${rounded} object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs`}
      />
    );
  }

  return (
    <div
      className={`${className} ${rounded} ${colorClass} flex items-center justify-center font-black tracking-wider uppercase shrink-0 shadow-sm border border-white/20 select-none transition-transform`}
      title={name}
    >
      {initials}
    </div>
  );
}
