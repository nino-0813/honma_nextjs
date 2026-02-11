'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IconMessageCircle } from '@/components/Icons';

const CustomerSupport = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">顧客対応</h1>
        <p className="text-sm text-gray-500 mt-1">メール送信・お問い合わせ対応</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/inquiries"
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <IconMessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">お問い合わせ一覧</h3>
            <p className="text-sm text-gray-500 mt-0.5">サイトから届いたお問い合わせを確認・返信</p>
          </div>
        </Link>
      </div>
    </>
  );
};

export default CustomerSupport;
