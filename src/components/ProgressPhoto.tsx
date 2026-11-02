import React, { useEffect, useState } from 'react';
import { resolvePhotoUrl } from '../lib/supabase';

interface ProgressPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

export const ProgressPhoto: React.FC<ProgressPhotoProps> = ({ src, alt = '', className = '', ...rest }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(Boolean(src));

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolvedUrl('');
      setLoading(false);
      return;
    }

    setLoading(true);
    resolvePhotoUrl(src)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setResolvedUrl(src);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (!src) return null;

  if (loading && !resolvedUrl) {
    return (
      <div
        className={`animate-pulse bg-white/5 flex items-center justify-center text-[10px] text-gray-500 ${className}`}
        aria-label={alt || 'Loading photo'}
      />
    );
  }

  if (!resolvedUrl) return null;

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      {...rest}
    />
  );
};

export default ProgressPhoto;
