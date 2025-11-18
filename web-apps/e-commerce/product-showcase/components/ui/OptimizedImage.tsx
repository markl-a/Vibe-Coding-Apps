'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Optimized Image Component with lazy loading and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">圖片載入失敗</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-600 animate-spin" />
        </div>
      )}

      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          quality={quality}
          priority={priority}
          className={`object-${objectFit} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          priority={priority}
          className={`object-${objectFit} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}

/**
 * Product Image Component with optimized loading
 */
interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function ProductImage({ src, alt, priority = false }: ProductImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
      quality={85}
      priority={priority}
      className="w-full h-full rounded-lg"
      objectFit="cover"
    />
  );
}

/**
 * Thumbnail Image Component
 */
interface ThumbnailImageProps {
  src: string;
  alt: string;
  size?: number;
}

export function ThumbnailImage({ src, alt, size = 80 }: ThumbnailImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={60}
      className="rounded-md"
      objectFit="cover"
    />
  );
}

/**
 * Hero Image Component with priority loading
 */
interface HeroImageProps {
  src: string;
  alt: string;
}

export function HeroImage({ src, alt }: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      quality={90}
      className="w-full h-full"
      objectFit="cover"
    />
  );
}
