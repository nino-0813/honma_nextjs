// メタデータ（title / description / canonical）は
// [[...slug]]/layout.tsx の generateMetadata でカテゴリごとに出し分けている。

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
