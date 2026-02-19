'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ContactSection = () => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      setSubmitStatus('error');
      setErrorMessage('お名前、メールアドレス、内容は必須項目です。');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabaseが利用できません。');
      }

      const { error } = await supabase
        .from('inquiries')
        .insert([
          {
            name,
            email,
            phone: phone || null,
            company_name: company || null,
            message,
            status: 'new',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        throw error;
      }

      setSubmitStatus('success');
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (error: any) {
      console.error('お問い合わせの送信に失敗しました:', error);
      setSubmitStatus('error');
      setErrorMessage(error?.message || 'お問い合わせの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-8 md:py-16 bg-white" id="contact">
      <div className="max-w-2xl mx-auto px-4">
        
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-700">お問い合わせを受け付けました。ありがとうございます。</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-serif">お名前 *</label>
            <input 
              type="text" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 p-3 focus:border-primary outline-none transition-colors bg-white" 
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="company" className="text-sm font-serif">法人名</label>
            <input 
              type="text" 
              id="company" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="border border-gray-200 p-3 focus:border-primary outline-none transition-colors bg-white" 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-serif">メールアドレス *</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 p-3 focus:border-primary outline-none transition-colors bg-white" 
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
             <label htmlFor="phone" className="text-sm font-serif">お電話番号</label>
             <input 
               type="tel" 
               id="phone" 
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               className="border border-gray-200 p-3 focus:border-primary outline-none transition-colors bg-white w-full" 
             />
          </div>

          <div className="flex flex-col gap-2">
             <label htmlFor="message" className="text-sm font-serif">内容 *</label>
             <textarea 
               id="message" 
               rows={5} 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="border border-gray-200 p-3 focus:border-primary outline-none transition-colors bg-white w-full resize-y" 
               required
             />
          </div>

          <div className="pt-4 text-center">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-primary text-white px-16 py-4 text-sm tracking-widest hover:bg-gray-800 transition-colors uppercase w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '送信中...' : '送信'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-8">
            このサイトはhCaptchaによって保護されており、hCaptchaプライバシーポリシーおよび利用規約が適用されます。
          </p>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;