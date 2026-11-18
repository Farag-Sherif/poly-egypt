import React, { forwardRef } from 'react';
import OptimizedImage, { normalizeSrc, getCleanUrl } from '@/src/components/common/OptimizedImage';

/**
 * AppImage - Next.js Image compatibility layer
 *
 * Wraps OptimizedImage with complete backwards compatibility for Next.js <Image /> syntax
 * (handling `fill`, `layout`, `objectFit`, `objectPosition`, `priority`, `sizes`, `width`,
 * `height`, `placeholder`, `blurDataURL`, `fallbackSrc`, etc.) so all existing components across
 * the project automatically benefit from OptimizedImage performance enhancements.
 */
const AppImage = forwardRef(function AppImage(props, ref) {
  return <OptimizedImage ref={ref} {...props} />;
});

AppImage.displayName = 'AppImage';

export default AppImage;
export { OptimizedImage, normalizeSrc, getCleanUrl };
