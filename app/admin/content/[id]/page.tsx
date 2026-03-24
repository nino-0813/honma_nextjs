'use client';

import ContentEditor from '@/admin/ContentEditor';

export default function AdminContentDetailPage({ params }: { params: { id: string } }) {
  return <ContentEditor contentId={params.id} />;
}
