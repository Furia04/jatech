'use client';

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, X, UploadCloud, AlertCircle } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  readOnly?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos = [],
  onChange,
  maxPhotos = 6,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Comprimir imagen usando Canvas para optimizar el almacenamiento
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si excede 1280px
          const MAX_DIM = 1280;
          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(img.src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Exportar en JPEG con calidad 0.75
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    setProcessing(true);

    try {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        setErrorMsg(`Límite máximo de ${maxPhotos} fotos alcanzado.`);
        setProcessing(false);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newPhotoPromises = filesToProcess.map((file) => compressImage(file));
      const compressedPhotos = await Promise.all(newPhotoPromises);

      onChange([...photos, ...compressedPhotos]);
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
      setErrorMsg('No se pudieron procesar algunas imágenes.');
    } finally {
      setProcessing(false);
      // Resetear inputs para permitir seleccionar el mismo archivo nuevamente si se desea
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removePhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(photos.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      {/* Botones de Captura y Carga */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Input oculto de galería */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={photos.length >= maxPhotos || processing}
          />

          {/* Input oculto directo para cámara en móviles */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFiles}
            disabled={photos.length >= maxPhotos || processing}
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || processing}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Tomar Foto (Cámara)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || processing}
            className="bg-surface-container-highest hover:bg-surface-variant text-on-surface border border-outline-variant px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-on-surface-variant" />
            <span>Subir de Galería</span>
          </button>

          <span className="text-[11px] text-on-surface-variant ml-auto font-mono">
            {photos.length} / {maxPhotos} fotos
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-error bg-error/10 border border-error/20 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid de Miniaturas de Fotos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {photos.map((photoUrl, index) => (
            <div
              key={index}
              onClick={() => setSelectedPhoto(photoUrl)}
              className="group relative aspect-square bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-all shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={`Evidencia ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-black">
                  <ZoomIn className="w-4 h-4" />
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => removePhoto(index, e)}
                    className="p-1.5 bg-error text-white rounded-lg hover:bg-error/80 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center text-on-surface-variant bg-surface-container-lowest/50">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
          <p className="text-xs font-semibold text-on-surface">Sin evidencias fotográficas aún</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Toma fotos de detalles físicos, pantalla, golpes o rayones del equipo recibido.
          </p>
        </div>
      )}

      {/* MODAL LIGHTBOX PARA VER FOTO AMPLIADA */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/60 bg-surface-container-high">
              <span className="text-xs font-bold text-on-surface flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Evidencia Fotográfica Ampliada
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/50 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto}
                alt="Foto ampliada de la orden"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
