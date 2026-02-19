import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BlogDetailView from './BlogDetailView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!supabase) return { title: 'BLOG' };
  const { data } = await supabase.from('blog_articles').select('title, excerpt').eq('id', id).eq('is_published', true).single();
  if (!data) return { title: 'BLOG' };
  return {
    title: data.title,
    description: (data.excerpt as string) || undefined,
    alternates: { canonical: `/blog/${id}` },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!supabase) return <BlogDetailView articleId={id} article={null} />;
  const { data, error } = await supabase.from('blog_articles').select('*').eq('id', id).single();
  if (error || !data) {
    const { data: anyData } = await supabase.from('blog_articles').select('id').eq('id', id).single();
    if (anyData) return <BlogDetailView articleId={id} article={null} isUnpublished />;
    notFound();
  }
  if (!data.is_published) return <BlogDetailView articleId={id} article={null} isUnpublished />;
  return <BlogDetailView articleId={id} article={data} />;
}
