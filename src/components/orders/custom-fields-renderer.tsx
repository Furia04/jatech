'use client';

import React from 'react';
import { CustomFieldDefinition } from '@/types';

interface CustomFieldsRendererProps {
  fields: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function CustomFieldsRenderer({
  fields,
  values,
  onChange,
}: CustomFieldsRendererProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="text-xs text-on-surface-variant/60 italic py-2">
        Sin campos personalizados adicionales para esta categoría.
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-surface border border-outline-variant/50 p-3 rounded-lg">
      <p className="font-label-caps text-label-caps text-primary uppercase font-bold text-[10px]">
        Campos Específicos de la Categoría (JSONB)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => {
          const val = values[field.name] ?? '';

          if (field.type === 'checkbox') {
            return (
              <div
                key={field.id}
                className="flex items-center gap-2 pt-2 md:col-span-2"
              >
                <input
                  type="checkbox"
                  id={`custom_${field.id}`}
                  checked={Boolean(val)}
                  onChange={(e) => onChange(field.name, e.target.checked)}
                  className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary"
                />
                <label
                  htmlFor={`custom_${field.id}`}
                  className="font-body-sm text-body-sm text-on-surface cursor-pointer select-none"
                >
                  {field.label} {field.required && <span className="text-error">*</span>}
                </label>
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.id}>
                <label className="block font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">
                  {field.label} {field.required && <span className="text-error">*</span>}
                </label>
                <select
                  value={val}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">-- Seleccionar opción --</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.id} className="md:col-span-2">
                <label className="block font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">
                  {field.label} {field.required && <span className="text-error">*</span>}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder || ''}
                  rows={2}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            );
          }

          return (
            <div key={field.id}>
              <label className="block font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">
                {field.label} {field.required && <span className="text-error">*</span>}
              </label>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={val}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
