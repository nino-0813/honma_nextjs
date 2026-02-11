import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconPackage, 
  IconHome, 
  IconUser,
  IconShoppingCart,
  IconUsers,
  IconBarChart,
  IconStar,
  IconMessageCircle,
  IconMail,
  IconFileText,
  IconSettings,
  IconPercent
} from '../../components/Icons';
import { useAdmin } from '../../hooks/useAdmin';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, actions }) => {
  const { pathname: location } = useLocation();
  const { adminUser } = useAdmin();

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = location.startsWith(href);
    return (
      <Link to={href} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gray-50 text-gray-900 border-l-2 border-gray-900' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-serif font-bold text-xs group-hover:opacity-80 transition-opacity">
               IK
             </div>
             <span className="font-serif font-bold tracking-widest text-sm">IKEVEGE</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem href="/admin" icon={IconDashboard} label="ホーム" />
          <NavItem href="/admin/orders" icon={IconShoppingCart} label="注文管理" />
          <NavItem href="/admin/products" icon={IconPackage} label="商品管理" />
          <NavItem href="/admin/shipping-methods" icon={IconSettings} label="発送方法管理" />
          <NavItem href="/admin/discounts" icon={IconPercent} label="クーポン" />
          <NavItem href="/admin/customers" icon={IconUsers} label="顧客管理" />
          <NavItem href="/admin/reviews" icon={IconStar} label="レビュー管理" />
          <NavItem href="/admin/customer-support" icon={IconMessageCircle} label="顧客対応" />
          <NavItem href="/admin/analytics" icon={IconBarChart} label="ストア分析" />
          <NavItem href="/admin/inquiries" icon={IconMail} label="お問い合わせ" />
          <NavItem href="/admin/blog" icon={IconFileText} label="BLOG管理" />
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">販売チャネル</p>
            <NavItem href="/" icon={IconHome} label="オンラインストア" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
               <IconUser className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {adminUser 
                  ? (adminUser.first_name && adminUser.last_name 
                      ? `${adminUser.last_name} ${adminUser.first_name}`.trim()
                      : adminUser.email?.split('@')[0] || '管理者')
                  : '読み込み中...'}
              </span>
              <span className="text-[10px] text-gray-400">
                {adminUser?.email || 'admin@ikevege.com'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col bg-gray-50">
        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
