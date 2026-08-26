type PetAvatarProps = {
  avatarKey?: string | null;
  name?: string;
  species?: string;
  size?: number;
  className?: string;
};

export const DOG_AVATARS = [
  'dog-pointed',
  'dog-floppy',
  'dog-spotted',
  'dog-patch',
  'dog-collar',
  'dog-perky',
] as const;

export const CAT_AVATARS = [
  'cat-pointed',
  'cat-floppy',
  'cat-stripes',
  'cat-round',
  'cat-patch',
  'cat-whiskers',
] as const;

export type AvatarKey = (typeof DOG_AVATARS)[number] | (typeof CAT_AVATARS)[number];

function resolveAvatarKey(avatarKey?: string | null, name?: string): string {
  if (avatarKey) return avatarKey;
  if (name && name.trim().toLowerCase() === 'nala') return 'dog-floppy';
  return 'dog-pointed';
}

export function PetAvatar({ avatarKey, name, species, size = 40, className = '' }: PetAvatarProps) {
  const key = resolveAvatarKey(avatarKey, name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#2f5d43"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={`${name ?? 'pet'} avatar`}
    >
      <circle cx="24" cy="24" r="23" fill="#f8f5ef" stroke="#d9d6ce" />
      {renderFace(key, species)}
    </svg>
  );
}

function renderFace(key: string, species?: string): React.ReactNode {
  if (key.startsWith('cat') || species === 'Cat') return renderCat(key);
  return renderDog(key);
}

/* ---- Shared face parts ---- */

function Eyes() {
  return (
    <>
      <circle cx="19" cy="24" r="1.1" fill="#2f5d43" stroke="none" />
      <circle cx="29" cy="24" r="1.1" fill="#2f5d43" stroke="none" />
    </>
  );
}

function Snout() {
  return (
    <>
      <path d="m24 27 1.4 1.6h-2.8L24 27Z" fill="#2f5d43" stroke="none" />
      <path d="M21.5 30.5c1.4 1 3.6 1 5 0" />
    </>
  );
}

/* ---- Dog variants ---- */

function DogHead() {
  return <path d="M13 23c0-6.3 4.8-10.2 11-10.2S35 16.7 35 23v3.4c0 6.1-4.8 9.8-11 9.8s-11-3.7-11-9.8V23Z" />;
}

function renderDog(key: string): React.ReactNode {
  switch (key) {
    case 'dog-floppy':
      return (
        <>
          <path d="M14.5 19.5c-3.6-1.4-5.5-4.4-5.5-8.2 0-1.1 1.1-1.6 1.9-.8 2.9 2.5 4.9 4 6.5 6.7" />
          <path d="M33.5 19.5c3.6-1.4 5.5-4.4 5.5-8.2 0-1.1-1.1-1.6-1.9-.8-2.9 2.5-4.9 4-6.5 6.7" />
          <DogHead />
          <Eyes />
          <Snout />
          <path d="M16.5 34.5h15" />
        </>
      );
    case 'dog-spotted':
      return (
        <>
          <path d="M13.5 18.5 10 11.5c-.5-1 .5-2 1.5-1.4l7 4.4" />
          <path d="M34.5 18.5 38 11.5c.5-1-.5-2-1.5-1.4l-7 4.4" />
          <DogHead />
          <Eyes />
          <Snout />
          <circle cx="16" cy="20" r="2" fill="#2f5d43" opacity="0.15" stroke="none" />
          <circle cx="31" cy="28" r="2.5" fill="#2f5d43" opacity="0.15" stroke="none" />
        </>
      );
    case 'dog-patch':
      return (
        <>
          <path d="M13.5 18.5 10 11.5c-.5-1 .5-2 1.5-1.4l7 4.4" />
          <path d="M34.5 18.5 38 11.5c.5-1-.5-2-1.5-1.4l-7 4.4" />
          <DogHead />
          <Eyes />
          <Snout />
          <path d="M14 18c2-1 4-1 5.5 0v3c-2.5 0-4.5-.5-5.5-1.5Z" fill="#2f5d43" opacity="0.15" stroke="none" />
        </>
      );
    case 'dog-collar':
      return (
        <>
          <path d="M13.5 18.5 10 11.5c-.5-1 .5-2 1.5-1.4l7 4.4" />
          <path d="M34.5 18.5 38 11.5c.5-1-.5-2-1.5-1.4l-7 4.4" />
          <DogHead />
          <Eyes />
          <Snout />
          <path d="M16 34.5h16" />
          <circle cx="24" cy="35.5" r="1" fill="#2f5d43" stroke="none" />
        </>
      );
    case 'dog-perky':
      return (
        <>
          <path d="M12 16 10.5 10c-.3-1 .7-1.8 1.5-1.2l5 3.5" />
          <path d="M36 16l1.5-6c.3-1-.7-1.8-1.5-1.2l-5 3.5" />
          <DogHead />
          <Eyes />
          <Snout />
          <path d="M14.5 19c1.4-1 3-1.3 4.5-.5" />
        </>
      );
    default: // dog-pointed
      return (
        <>
          <path d="M13.5 18.5 10 11.5c-.5-1 .5-2 1.5-1.4l7 4.4" />
          <path d="M34.5 18.5 38 11.5c.5-1-.5-2-1.5-1.4l-7 4.4" />
          <DogHead />
          <Eyes />
          <Snout />
        </>
      );
  }
}

/* ---- Cat variants ---- */

function CatHead() {
  return <path d="M14 24c0-5.5 4-9 10-9s10 3.5 10 9v3c0 5-4 8.5-10 8.5s-10-3.5-10-8.5v-3Z" />;
}

function CatEyes() {
  return (
    <>
      <ellipse cx="19" cy="24" rx="1.3" ry="1.6" fill="#2f5d43" stroke="none" />
      <ellipse cx="29" cy="24" rx="1.3" ry="1.6" fill="#2f5d43" stroke="none" />
    </>
  );
}

function CatSnout() {
  return (
    <>
      <path d="m24 27 1.2 1.4h-2.4L24 27Z" fill="#2f5d43" stroke="none" />
      <path d="M22 30c1 .8 2 .8 4 0" />
      <path d="M19 31c-1 .5-2 .5-3 0" />
      <path d="M32 31c-1 .5-2 .5-3 0" />
    </>
  );
}

function renderCat(key: string): React.ReactNode {
  switch (key) {
    case 'cat-floppy':
      return (
        <>
          <path d="M14 20c-2-3-2.5-6-1-8 .8-1 2-.5 2.5.5 1 2 2 4 3.5 5.5" />
          <path d="M34 20c2-3 2.5-6 1-8-.8-1-2-.5-2.5.5-1 2-2 4-3.5 5.5" />
          <CatHead />
          <CatEyes />
          <CatSnout />
        </>
      );
    case 'cat-stripes':
      return (
        <>
          <path d="M14 16 12 10c-.3-1 .7-1.8 1.5-1.2l4 3" />
          <path d="M34 16l2-6c.3-1-.7-1.8-1.5-1.2l-4 3" />
          <CatHead />
          <CatEyes />
          <CatSnout />
          <path d="M17 19v4" />
          <path d="M31 19v4" />
          <path d="M24 16v3" />
        </>
      );
    case 'cat-round':
      return (
        <>
          <path d="M14 17 12 11c-.3-1 .7-1.8 1.5-1.2l4.5 3.2" />
          <path d="M34 17l2-6c.3-1-.7-1.8-1.5-1.2l-4.5 3.2" />
          <path d="M13 25c0-5 4.5-8.5 11-8.5s11 3.5 11 8.5v2c0 5-4.5 8.5-11 8.5s-11-3.5-11-8.5v-2Z" />
          <CatEyes />
          <CatSnout />
        </>
      );
    case 'cat-patch':
      return (
        <>
          <path d="M14 16 12 10c-.3-1 .7-1.8 1.5-1.2l4 3" />
          <path d="M34 16l2-6c.3-1-.7-1.8-1.5-1.2l-4 3" />
          <CatHead />
          <CatEyes />
          <CatSnout />
          <path d="M15 19c2-1 4-1 5 0v3c-2 0-4-.5-5-1.5Z" fill="#2f5d43" opacity="0.15" stroke="none" />
        </>
      );
    case 'cat-whiskers':
      return (
        <>
          <path d="M14 16 12 10c-.3-1 .7-1.8 1.5-1.2l4 3" />
          <path d="M34 16l2-6c.3-1-.7-1.8-1.5-1.2l-4 3" />
          <CatHead />
          <CatEyes />
          <CatSnout />
          <path d="M16 28l-5-1" />
          <path d="M16 30l-5 1.5" />
          <path d="M32 28l5-1" />
          <path d="M32 30l5 1.5" />
        </>
      );
    default: // cat-pointed
      return (
        <>
          <path d="M14 16 12 10c-.3-1 .7-1.8 1.5-1.2l4 3" />
          <path d="M34 16l2-6c.3-1-.7-1.8-1.5-1.2l-4 3" />
          <CatHead />
          <CatEyes />
          <CatSnout />
        </>
      );
  }
}
