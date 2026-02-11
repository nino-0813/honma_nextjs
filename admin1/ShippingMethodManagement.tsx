import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { IconPlus, IconEdit, IconTrash, IconPackage } from '../../components/Icons';
import { ShippingMethod, AreaFees } from '../../types';

// 画像の料金表に合わせた地域区分
const AREA_LABELS: Record<keyof AreaFees, string> = {
  hokkaido: '北海道',
  north_tohoku: '北東北（青森、秋田、岩手）',
  south_tohoku: '南東北（宮城、山形、福島）',
  kanto: '関東（茨城、栃木、群馬、埼玉、千葉、神奈川、山梨、東京）',
  shinetsu: '信越（新潟、長野）',
  hokuriku: '北陸（富山、石川、福井）',
  chubu: '中部（静岡、愛知、三重、岐阜）',
  kansai: '関西（大阪、京都、滋賀、奈良、和歌山、兵庫）',
  chugoku: '中国（岡山、広島、山口、鳥取、島根）',
  shikoku: '四国（香川、徳島、愛媛、高知）',
  kyushu: '九州（福岡、佐賀、長崎、熊本、大分、宮崎、鹿児島）',
  okinawa: '沖縄',
};

const ShippingMethodManagement = () => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // area_feesをAreaFees型に変換
      const methods = (data || []).map((method: any) => ({
        ...method,
        area_fees: (method.area_fees || {}) as AreaFees,
      }));

      setShippingMethods(methods);
    } catch (error) {
      console.error('発送方法の取得エラー:', error);
      alert('発送方法の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この発送方法を削除しますか？\n紐づいている商品からも削除されます。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('発送方法を削除しました');
      fetchShippingMethods();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const formatAreaFees = (method: ShippingMethod): string => {
    if (method.fee_type === 'uniform') {
      return method.uniform_fee ? `全国一律: ¥${method.uniform_fee.toLocaleString()}` : '未設定';
    }

    const fees = Object.entries(method.area_fees || {})
      .filter(([_, fee]) => fee !== null && fee !== undefined)
      .map(([area, fee]) => `${AREA_LABELS[area as keyof AreaFees]}: ¥${fee?.toLocaleString()}`)
      .join(', ');

    return fees || '未設定';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">発送方法管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            ダンボール単位の発送方法と送料を管理します
          </p>
        </div>
        <Link to="/admin/shipping-methods/new">
          <a className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            <IconPlus className="w-4 h-4" />
            新規作成
          </a>
        </Link>
      </div>

      {/* 発送方法一覧 */}
      {shippingMethods.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <IconPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">発送方法が登録されていません</p>
          <Link to="/admin/shipping-methods/new">
            <a className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              <IconPlus className="w-4 h-4" />
              最初の発送方法を作成
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shippingMethods.map((method) => (
            <div
              key={method.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {method.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {method.box_size && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">サイズ:</span>
                        <span className="font-medium">{method.box_size}サイズ</span>
                      </div>
                    )}
                    {method.max_weight_kg && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">最大重量:</span>
                        <span className="font-medium">{method.max_weight_kg}kg</span>
                      </div>
                    )}
                    {method.max_items_per_box && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">1箱に入る数:</span>
                        <span className="font-medium">{method.max_items_per_box}個</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">送料設定</div>
                <div className="text-sm text-gray-900 font-medium">
                  {formatAreaFees(method)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/admin/shipping-methods/${method.id}`}>
                  <a className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <IconEdit className="w-4 h-4" />
                    編集
                  </a>
                </Link>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <IconTrash className="w-4 h-4" />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingMethodManagement;

