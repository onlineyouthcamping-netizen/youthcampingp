'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  /** Cloudinary width transform — default 1200. Use 800 for cards, 400 for thumbnails. */
  cloudinaryWidth?: number;
  /** Optional Bunny CDN derivative used without changing the stored source URL. */
  bunnyVariant?: string;
}

const RESPONSIVE_WIDTHS = [320, 480, 640, 800, 960, 1200, 1280, 1600, 1920];

function getResponsiveWidths(maxWidth: number) {
  const widths = RESPONSIVE_WIDTHS.filter((width) => width <= maxWidth);
  if (!widths.includes(maxWidth)) widths.push(maxWidth);
  return widths.sort((a, b) => a - b);
}

function withCloudinaryWidth(url: string, width: number) {
  const uploadMarker = '/upload/';
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) return url;

  const before = url.slice(0, uploadIndex + uploadMarker.length);
  const segments = url.slice(uploadIndex + uploadMarker.length).split('/');
  const firstSegment = segments[0] || '';
  const hasTransform = firstSegment.length > 0 && !/^v\d+$/.test(firstSegment);
  const sourceTransforms = hasTransform ? firstSegment.split(',').filter(Boolean) : [];
  const transforms = sourceTransforms.filter((part) => !/^w_\d+$/.test(part));

  if (!transforms.some((part) => part.startsWith('f_'))) transforms.unshift('f_auto');
  if (!transforms.some((part) => part.startsWith('q_'))) transforms.push('q_auto:eco');
  transforms.push(`w_${width}`);
  if (!transforms.some((part) => part.startsWith('c_'))) transforms.push('c_limit');

  const assetSegments = hasTransform ? segments.slice(1) : segments;
  return `${before}${transforms.join(',')}/${assetSegments.join('/')}`;
}

export function OptimizedImage({ 
  src, 
  alt, 
  fallbackSrc = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 
  className = '', 
  priority,
  cloudinaryWidth = 600,
  bunnyVariant,
  ...props 
}: OptimizedImageProps) {
  const { onLoad, onError, ...imageProps } = props;
  const [errorObj, setErrorObj] = useState(false);

  // 1. Validation and Normalization (Synchronous)
  let finalSrc = src;

  if (!finalSrc || typeof finalSrc !== 'string' || finalSrc.includes('image:')) {
    finalSrc = fallbackSrc;
  } else if (finalSrc.startsWith('/uploads/')) {
    finalSrc = fallbackSrc; // Block local /uploads/
  } else if (finalSrc.includes('unsplash.com') && !finalSrc.startsWith('https://')) {
    finalSrc = fallbackSrc; // Block incomplete unsplash
  } else if (!finalSrc.startsWith('http') && !finalSrc.startsWith('/')) {
    finalSrc = fallbackSrc; // Block invalid URLs
  }

  const isCloudinary = finalSrc && finalSrc.includes('res.cloudinary.com');
  const isUnsplash = finalSrc && finalSrc.includes('images.unsplash.com');
  const isBunny = finalSrc && finalSrc.includes('vl-prod-static.b-cdn.net');
  const resolvedWidth = cloudinaryWidth || 500;

  if (isUnsplash) {
    // Force compact target width & aggressive WebP compression
    const cleanUrl = finalSrc.includes('?') ? finalSrc.split('?')[0] : finalSrc;
    const params = new URLSearchParams(finalSrc.includes('?') ? finalSrc.split('?')[1] : '');
    params.set('auto', 'format');
    params.set('fit', 'crop');
    params.set('q', '65');
    params.set('w', resolvedWidth.toString());
    finalSrc = `${cleanUrl}?${params.toString()}`;
  } else if (isCloudinary) {
    finalSrc = withCloudinaryWidth(finalSrc, resolvedWidth);
  } else if (isBunny && bunnyVariant && finalSrc.includes('/original/')) {
    finalSrc = finalSrc.replace('/original/', `/${bunnyVariant}/`);
  }

  const currentSrc = errorObj ? fallbackSrc : finalSrc;

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={priority ? "eager" : (props.loading || "eager")}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn(
        "w-full h-full object-cover",
        className
      )}
      onError={(event) => {
        setErrorObj(true);
        onError?.(event);
      }}
      {...imageProps}
    />
  );
}
