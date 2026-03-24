export interface ContentItem {
  id: string;
  title: string;
  type: 'page' | 'blog' | 'announcement';
  status: 'published' | 'draft' | 'archived';
  author: string;
  updatedAt: string;
  views: number;
}

export const mockContent: ContentItem[] = [
  { id: '1', title: '自然栽培について', type: 'page', status: 'published', author: 'Admin', updatedAt: '2025-12-01', views: 1250 },
  { id: '2', title: '新米の季節がやってきました', type: 'blog', status: 'published', author: 'Admin', updatedAt: '2025-12-02', views: 890 },
  { id: '3', title: '年末年始の配送について', type: 'announcement', status: 'published', author: 'Admin', updatedAt: '2025-12-03', views: 2100 },
  { id: '4', title: '佐渡ヶ島の自然', type: 'blog', status: 'draft', author: 'Admin', updatedAt: '2025-11-28', views: 0 },
];

export const getContentTypeLabel = (type: ContentItem['type']) => {
  switch (type) {
    case 'page':
      return 'ページ';
    case 'blog':
      return 'ブログ';
    case 'announcement':
      return 'お知らせ';
    default:
      return type;
  }
};

export const getContentStatusColor = (status: ContentItem['status']) => {
  switch (status) {
    case 'published':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'draft':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case 'archived':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
};

export const getContentStatusLabel = (status: ContentItem['status']) => {
  switch (status) {
    case 'published':
      return '公開中';
    case 'draft':
      return '下書き';
    case 'archived':
      return 'アーカイブ';
    default:
      return status;
  }
};
