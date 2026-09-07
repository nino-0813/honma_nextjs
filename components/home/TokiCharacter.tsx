const CHARACTER_IMAGES = {
  front: '/images/renewal/toki-characters/front.webp',
  side: '/images/renewal/toki-characters/side.webp',
  back: '/images/renewal/toki-characters/back.webp',
  flying: '/images/renewal/toki-characters/flying.webp',
  logo: '/images/renewal/toki-characters/toki-logo.webp',
  thanks: '/images/renewal/toki-characters/thanks.webp',
  hello: '/images/renewal/toki-characters/hello.webp',
  fast: '/images/renewal/toki-characters/fly-fast.webp',
} as const;

type CharacterName = keyof typeof CHARACTER_IMAGES;

export default function TokiCharacter({
  character,
  className = '',
  motion = 'float',
}: {
  character: CharacterName;
  className?: string;
  motion?: 'float' | 'peek' | 'fly';
}) {
  const cropsCaption = ['front', 'side', 'back', 'flying'].includes(character);

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 block overflow-hidden rounded-full bg-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.12)] toki-motion-${motion} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CHARACTER_IMAGES[character]}
        alt=""
        draggable={false}
        className={cropsCaption ? 'h-[125%] w-full object-cover object-top' : 'h-full w-full object-contain'}
      />
    </span>
  );
}
