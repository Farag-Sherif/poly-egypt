import React from 'react';

export default function AppImage({
  src,
  alt = '',
  width,
  height,
  className,
  style,
  priority,
  fill,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  loader,
  unoptimized,
  ...rest
}) {
  const computedStyle = { ...style };
  if (fill) {
    computedStyle.position = computedStyle.position || 'absolute';
    computedStyle.inset = computedStyle.inset || 0;
    computedStyle.width = computedStyle.width || '100%';
    computedStyle.height = computedStyle.height || '100%';
    computedStyle.objectFit = computedStyle.objectFit || 'cover';
  }
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={computedStyle}
      {...rest}
    />
  );
}
