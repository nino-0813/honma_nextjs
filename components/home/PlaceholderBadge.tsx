import { SHOW_PLACEHOLDER_BADGE } from './placeholders';

/** 仮素材であることを示すバッジ。素材が揃ったら placeholders.ts のフラグで一括で消せる */
export default function PlaceholderBadge() {
  if (!SHOW_PLACEHOLDER_BADGE) return null;
  return (
    <span className="absolute top-2 left-2 z-10 rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-white">
      仮素材
    </span>
  );
}
