
import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

// Progressive Image Loading Component（素の public URL のみ使用、クエリパラメータなし）
export const FadeInImage = ({
  src,
  alt,
  className = '',
  priority = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (src) setIsLoaded(false);
  }, [src]);

  const hasObjectContain = className.includes('object-contain');
  const defaultObjectFit = hasObjectContain ? '' : 'object-cover';
  const bgColor = hasObjectContain ? 'bg-transparent' : 'bg-[#f4f4f4]';

  return (
    <div className={`relative overflow-hidden ${bgColor} w-full h-full`}>
      <div className={`absolute inset-0 ${bgColor} transition-opacity duration-200 ease-out pointer-events-none ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height ?? width}
        loading={priority ? "eager" : "lazy"}
        {...(priority && { fetchpriority: "high" as const })}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={`relative z-10 w-full h-full ${defaultObjectFit} transition-opacity duration-200 ${className} ${isLoaded ? 'opacity-100' : 'opacity-90'}`}
      />
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  loading?: boolean; // 外部制御用のローディングフラグ
}

// Micro-interaction Button: Idle -> Loading -> Success -> Callback
export const LoadingButton = ({ onClick, children, disabled, className, loading, ...props }: LoadingButtonProps) => {
  const [internalStatus, setInternalStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // 外部からloadingが制御されている場合
  if (loading !== undefined) {
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${className} relative`}
        {...props}
      >
        <span className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </button>
    );
  }

  // 従来の内部完結型動作
  const handleClick = async () => {
    if (internalStatus !== 'idle' || !onClick) return;
    setInternalStatus('loading');
    
    // Simulate network request / processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setInternalStatus('success');
    
    // Show success state briefly before triggering the actual action (opening cart)
    setTimeout(() => {
      onClick();
      setTimeout(() => setInternalStatus('idle'), 500); // Reset button state after drawer opens
    }, 800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || internalStatus !== 'idle'}
      className={`${className} relative overflow-hidden transition-all duration-500 ease-out ${
        internalStatus === 'success' ? '!bg-gray-900 !border-gray-900 text-white' : ''
      }`}
      {...props}
    >
      {/* Default Text */}
      <span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
        internalStatus === 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}>
        {children}
      </span>
      
      {/* Loading Spinner */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
        internalStatus === 'loading' ? 'opacity-100 translate-y-0' : internalStatus === 'idle' ? 'opacity-0 translate-y-full' : 'opacity-0 -translate-y-full'
      }`}>
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      </div>

      {/* Success State */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
        internalStatus === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}>
        <span className="flex items-center gap-2 font-medium tracking-widest text-white">
          <Check className="w-5 h-5" /> ADDED
        </span>
      </div>
    </button>
  );
};
