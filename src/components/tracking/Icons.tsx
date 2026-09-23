// Custom SVG icon set — replaces all emojis with crisp, scalable vector icons.
// All icons inherit currentColor and are 24x24 by default.

import type { CSSProperties } from 'react'

export type IconName =
  | 'nose'
  | 'face'
  | 'eye'
  | 'eyes'
  | 'mouth'
  | 'forehead'
  | 'chin'
  | 'target'
  | 'camera'
  | 'zoom'
  | 'shake'
  | 'film'
  | 'sparkle'
  | 'download'
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'skipStart'
  | 'skipEnd'
  | 'loop'
  | 'volume'
  | 'mute'
  | 'sunglasses'
  | 'blur'
  | 'spotlight'
  | 'lock'
  | 'unlock'
  | 'trash'
  | 'plus'
  | 'close'
  | 'check'
  | 'warning'
  | 'image'
  | 'text'
  | 'shape'
  | 'star'
  | 'heart'
  | 'circle'
  | 'ring'
  | 'square'
  | 'magic'
  | 'track'
  | 'overlay'
  | 'look'
  | 'reset'
  | 'glasses'
  | 'rocket'
  | 'fire'
  | 'crown'
  | 'bolt'
  | 'unicorn'
  | 'skull'
  | 'ghost'
  | 'frog'
  | 'pizza'
  | 'gamepad'
  | 'rainbow'
  | 'diamond'
  | 'music'
  | 'pin'
  | 'crosshair'
  | 'expand'
  | 'contract'
  | 'rotate'
  | 'flip'
  | 'speed'
  | 'freeze'
  | 'reverse'
  | 'split'
  | 'pip'
  | 'save'
  | 'load'
  | 'settings'
  | 'gpu'
  | 'cpu'
  | 'thugGlasses'
  | 'goldChain'
  | 'thugHat'
  | 'money'
  | 'dollarSign'
  | 'cigarette'
  | 'grill'
  | 'bandana'
  | 'goldTooth'
  | 'crown2'
  | 'flame2'
  | 'skull2'
  | 'lightning'
  | 'hundred'
  | 'fire2'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}

const PATHS: Record<IconName, string> = {
  nose: 'M6 3h12a2 2 0 0 1 2 2v6a8 8 0 0 1-16 0V5a2 2 0 0 1 2-2zm4 12a2 2 0 1 0 4 0',
  face: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.5 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 15a3 3 0 0 0 6 0',
  eye: 'M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  eyes: 'M2 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6zm4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm12 0s3-6 8-6',
  mouth: 'M4 9a8 8 0 0 1 16 0v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zm3 2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2',
  forehead: 'M3 6a9 3 0 0 1 18 0v4a9 3 0 0 1-18 0V6zm9 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-3-3z',
  chin: 'M5 3h14a2 2 0 0 1 2 2v8a8 8 0 0 1-8 8H11a8 8 0 0 1-8-8V5a2 2 0 0 1 2-2zm7 9a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0v-4a2 2 0 0 0-2-2z',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  camera: 'M3 7a2 2 0 0 1 2-2h2l1.5-2h7L17 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm9 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  zoom: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm6.5 8.5L21 19',
  shake: 'M3 12h2l2-6 4 12 4-12 2 6h4M3 12l2 2M3 12l2-2',
  film: 'M3 4h18v16H3V4zm3 2v2m0 4v2m0 4v2m12-12v2m0 4v2m0 4v2M9 6h6v12H9V6z',
  sparkle: 'M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14',
  play: 'M6 4l14 8-14 8V4z',
  pause: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z',
  prev: 'M19 4l-12 8 12 8V4zM5 4h2v16H5V4z',
  next: 'M5 4l12 8-12 8V4zm12 0h2v16h-2V4z',
  skipStart: 'M6 4v16M20 4L8 12l12 8V4z',
  skipEnd: 'M18 4v16M4 4l12 8-12 8V4z',
  loop: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4m14-3v2a4 4 0 0 1-4 4H3',
  volume: 'M11 5L6 9H2v6h4l5 4V5zm5 3a4 4 0 0 1 0 8m2-12a8 8 0 0 1 0 16',
  mute: 'M11 5L6 9H2v6h4l5 4V5zm7 5l4 4m0-4l-4 4',
  sunglasses: 'M2 8h20v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-2 3 3 0 0 1-3 2H5a3 3 0 0 1-3-3V8zm3 7a5 5 0 0 0 4-2m4-3h4',
  blur: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3a6 6 0 0 1 6 6M6 12a6 6 0 0 1 6-6',
  spotlight: 'M12 2L8 8h8L12 2zM4 12a8 8 0 0 1 16 0v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8zm4 4h8',
  lock: 'M5 11h14v10H5V11zm2 0V7a5 5 0 0 1 10 0v4M12 15v2',
  unlock: 'M5 11h14v10H5V11zm2 0V7a5 5 0 0 1 9-3',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  warning: 'M12 2L2 20h20L12 2zm0 6v6m0 4v0',
  image: 'M3 5h18v14H3V5zm3 10l4-4 3 3 5-5M8 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  text: 'M4 6h16M4 6V4h16v2M12 6v14M9 20h6',
  shape: 'M12 3l9 16H3L12 3z',
  star: 'M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z',
  heart: 'M12 21s-7-5-9-9a5 5 0 0 1 9-4 5 5 0 0 1 9 4c-2 4-9 9-9 9z',
  circle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  ring: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
  square: 'M4 4h16v16H4V4z',
  magic: 'M5 4l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4zm10 6l1.5 3 3 1.5-3 1.5L15 19l-1.5-3-3-1.5 3-1.5L15 10zm-5 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z',
  track: 'M3 12h2m14 0h2M12 3v2m0 14v2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  overlay: 'M3 3h8v8H3V3zm10 10h8v8h-8v-8zM3 13h8v8H3v-8zM13 3h8v8h-8V3z',
  look: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3v14M5 12h14M7 7l10 10M17 7L7 17',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8m0 0V3m0 5h5',
  glasses: 'M2 8h20v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-2 3 3 0 0 1-3 2H5a3 3 0 0 1-3-3V8z',
  rocket: 'M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10zm-3 16h6M10 20l1 2m3-2l-1 2M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  fire: 'M12 2c1 3-1 4-2 6-1 1-2 2-2 4a4 4 0 0 0 8 0c0-2-1-3-2-4 1 2-1 3-2 1 2-2 2-5 0-7z',
  crown: 'M2 8l4 4 6-8 6 8 4-4-2 12H4L2 8z',
  bolt: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  unicorn: 'M5 21V9c0-4 3-7 7-7 3 0 5 2 6 5l-3 1c-1-2-2-3-3-3-2 0-3 1-4 3l4 2v8M9 9l-2-3',
  skull: 'M12 2a8 8 0 0 0-8 8v5l3 3h2v-3h6v3h2l3-3v-5a8 8 0 0 0-8-8zM9 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  ghost: 'M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2-3 2zM9 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  frog: 'M3 10a9 9 0 0 1 18 0v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 16h6',
  pizza: 'M12 2L2 6l4 14a2 2 0 0 0 2.5 1.5L12 19l3.5 2.5A2 2 0 0 0 18 20L22 6 12 2zM9 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-3 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  gamepad: 'M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-7 2.5L14 16h-4l-1 .5A4 4 0 0 1 2 14v-2a4 4 0 0 1 4-4zM7 12h2m-1-1v2m7-1h0m3 0h0',
  rainbow: 'M2 18a10 10 0 0 1 20 0M5 18a7 7 0 0 1 14 0M8 18a4 4 0 0 1 8 0',
  diamond: 'M6 3h12l3 6-9 12L3 9l3-6zm3 6h6l-3 12',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  pin: 'M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  crosshair: 'M12 2v6m0 8v6M2 12h6m8 0h6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  contract: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  rotate: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  flip: 'M12 3v18M5 8l5-3v14l-5-3m9-11l5 3-5 3',
  speed: 'M13 2L3 14h7l-1 8 10-12h-7l1-8zM3 20h18',
  freeze: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19',
  reverse: 'M11 2L3 9l8 7V2zm2 20l8-7-8-7v14z',
  split: 'M12 3v18M3 8l5-3v6L3 8zm18 0l-5-3v6l5-3zM3 16l5-3v6l-5-3zm18 0l-5-3v6l5-3z',
  pip: 'M3 5h18v12H3V5zm10 6h6v4h-6v-4z',
  save: 'M5 3h12l4 4v14H3V3h2zm4 2v4h6V5H9zm-2 9v7h10v-7H7z',
  load: 'M3 7h6V3M3 7l4-4M3 7v14h14M21 17h-6v4M21 17l-4 4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4a8.5 8.5 0 0 0-.2-1.8l2-1.5-2-3.5-2.4 1a8 8 0 0 0-3-1.8L15 2H9l-.4 2.6a8 8 0 0 0-3 1.8l-2.4-1-2 3.5 2 1.5A8.5 8.5 0 0 0 3 12c0 .6.1 1.2.2 1.8l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 3 1.8L9 22h6l.4-2.6a8 8 0 0 0 3-1.8l2.4 1 2-3.5-2-1.5c.1-.6.2-1.2.2-1.8z',
  gpu: 'M3 6h18v12H3V6zm4 3v6m3-6v6m3-6v6m3-6v6',
  cpu: 'M6 6h12v12H6V6zm3 3h6v6H9V9zM8 2v2M16 2v2M8 20v2M16 20v2M2 8h2M2 16h2M20 8h2M20 16h2',
  // ---- Thug Life / Meme icons ----
  thugGlasses: 'M1 7h8a3 3 0 0 1 3 3v0a3 3 0 0 1 3 0h8v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-1a1 1 0 0 0-2 0v1a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V7z',
  goldChain: 'M6 8h12l2 3-2 5H6l-2-5 2-3zm0 8l-1 4M18 16l1 4M9 12h6',
  thugHat: 'M2 10L6 4h12l4 6H2zm0 0v3h20v-3M8 10l1-4M16 10l-1-4',
  money: 'M3 6h18v12H3V6zm3 2c0 2 12 2 12 4s-12 2-12 4m3-6c0 1 6 1 6 2s-6 1-6 2',
  dollarSign: 'M12 2v20M16 6c-2-2-6-1-6 2s4 2 6 4-2 4-6 2',
  cigarette: 'M2 14h14v4H2v-4zm14-1h2v6h-2V13zm2-2h2v8h-2v-8zM2 14l-1 2M5 14v4M8 14v4M11 14v4',
  grill: 'M4 8h16v8H4V8zm2 2v4h3v-4H6zm5 0v4h2v-4h-2zm4 0v4h3v-4h-3z',
  bandana: 'M3 8c4-2 14-2 18 0l-1 4c-4-1-12-1-16 0L3 8zm0 0l-2 3M21 8l2 3M6 12l-2 6M18 12l2 6',
  goldTooth: 'M6 10h12v6H6v-6zm2 1v4M10 11v4M14 11v4M18 11v4',
  crown2: 'M3 18l2-12 4 5 3-7 3 7 4-5 2 12H3zm0 2h18',
  flame2: 'M12 2c1 4-2 5-3 8-1 2 0 4 2 4 3 0 4-3 3-6 3 2 4 5 2 8-2 3-6 4-8 1-3-3-2-9 1-15z',
  skull2: 'M12 3a8 8 0 0 0-8 8v4l2 2v3h2v-2h8v2h2v-3l2-2v-4a8 8 0 0 0-8-8zM9 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 18h4',
  lightning: 'M13 2L4 14h6l-2 8 10-12h-6l1-8z',
  hundred: 'M4 8c0-2 1-3 3-3s3 1 3 3v8c0 2-1 3-3 3s-3-1-3-3V8zm10 0c0-2 1-3 3-3s3 1 3 3v8c0 2-1 3-3 3s-3-1-3-3V8zM6 6L4 4M18 6l2-2M6 18l-2 2M18 18l2 2',
  fire2: 'M12 2c2 3-1 5-2 7-1 2 1 3 2 2-2 4 0 7 2 7 4 0 5-4 3-8 0 3-2 4-3 3 2-4 0-8-2-11z',
}

export function Icon({ name, size = 24, className, style }: IconProps) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

// Map emoji attachments to icon names for the attachment system
export const EMOJI_TO_ICON: Record<string, IconName> = {
  '😎': 'sunglasses',
  '🕶️': 'glasses',
  '🔥': 'fire',
  '⭐': 'star',
  '💥': 'shake',
  '👑': 'crown',
  '❤️': 'heart',
  '🎯': 'target',
  '💫': 'sparkle',
  '✨': 'sparkle',
  '🚀': 'rocket',
  '👀': 'eyes',
  '💪': 'bolt',
  '🎉': 'sparkle',
  '💯': 'star',
  '🌟': 'star',
  '⚡': 'bolt',
  '🦄': 'unicorn',
  '🎩': 'crown',
  '💎': 'diamond',
  '🌈': 'rainbow',
  '🍕': 'pizza',
  '🎮': 'gamepad',
  '😈': 'skull',
  '👻': 'ghost',
  '💀': 'skull',
  '🤡': 'ghost',
  '🐸': 'frog',
  '🙈': 'blur',
  '💨': 'speed',
  '💧': 'circle',
  '❄️': 'freeze',
  '🎵': 'music',
  '📍': 'pin',
  '❌': 'close',
  '✅': 'check',
  '⚠️': 'warning',
}

// Icon picker for attachment system — all available icons as a grid
export const ATTACHMENT_ICONS: IconName[] = [
  // Thug Life / Meme
  'thugGlasses', 'goldChain', 'thugHat', 'money', 'dollarSign', 'cigarette',
  'grill', 'bandana', 'goldTooth', 'crown2', 'flame2', 'skull2',
  'lightning', 'hundred', 'fire2',
  // Classic
  'sunglasses', 'fire', 'star', 'crown', 'heart', 'target',
  'sparkle', 'rocket', 'bolt', 'unicorn', 'diamond', 'rainbow',
  'ghost', 'frog', 'pizza', 'gamepad', 'music', 'warning',
]
