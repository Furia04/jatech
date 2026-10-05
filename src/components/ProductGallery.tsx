'use client';

import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  title: string;
  marca: string;
  grado: string;
}

export default function ProductGallery({ images, title, marca, grado }: ProductGalleryProps) {
  // Ensure we have at least one image
  const allImages = images && images.length > 0 ? images : ['/placeholder.jpg'];
  const [selectedImage, setSelectedImage] = useState(allImages[0]);

  return (
    <div className="p-6 lg:p-10 bg-surface-container-lowest border-b lg:border-b-0 lg:border-r border-cyber-border space-y-4 h-full flex flex-col">
      {/* Imagen Principal */}
      <div className="aspect-square relative rounded-xl border border-cyber-border bg-surface-container overflow-hidden group flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent z-10"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={selectedImage} 
          alt={title} 
          className="w-full h-full object-contain p-6 relative z-0 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-mono px-2 py-1 rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            {marca}
          </span>
          <span className="bg-surface-bright text-on-surface border border-outline text-xs font-mono px-2 py-1 rounded">
            {grado}
          </span>
        </div>
      </div>
      
      {/* Miniaturas */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {allImages.map((img, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedImage(img)}
              className={`aspect-square rounded-lg border overflow-hidden transition-all cursor-pointer ${
                selectedImage === img 
                  ? 'border-primary ring-1 ring-primary shadow-[0_0_10px_rgba(245,158,11,0.2)] bg-surface-container-high' 
                  : 'border-cyber-border bg-surface-container hover:border-neon-cyan/50'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${title} thumbnail ${i}`} className="w-full h-full object-contain p-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
