'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { CreateMarketProductInput, UnitType } from '@/types/market';
import {
  batchUpsertMarketProducts,
  fetchMarketCategories,
  createMarketCategory,
} from '@/lib/supabase/market-services';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

interface ParsedRow {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit_type: UnitType;
  is_weighable: boolean;
  isValid: boolean;
  error?: string;
}

export function CSVImportModal({ isOpen, onClose, onCompleted }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    inserted: number;
    updated: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Descargar plantilla CSV modelo
  function handleDownloadTemplate() {
    const csvContent =
      'barcode,name,brand,category,cost_price,sale_price,stock,min_stock,unit_type\n' +
      '7790895000997,Coca Cola 2.25L,Coca Cola,Bebidas,2500,3500,24,6,unit\n' +
      '7791234567890,Galletitas Oreo 118g,Mondelez,Almacén,800,1200,50,10,unit\n' +
      '2000001000000,Manzana Roja Red,Frutería,Frutas y Verduras,1200,1800,15.5,5,kg\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_productos_supermercado.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Parsear contenido CSV
  function parseCSVContent(text: string) {
    setParsingError(null);
    setResultSummary(null);

    // Normalizar saltos de línea
    const lines = text
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParsingError('El archivo CSV está vacío o no contiene filas de datos.');
      setParsedRows([]);
      return;
    }

    // Detectar separador (coma o punto y coma)
    const headerLine = lines[0];
    const separator = headerLine.includes(';') ? ';' : ',';

    const rawHeaders = headerLine
      .split(separator)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const barcodeIdx = rawHeaders.indexOf('barcode');
    const nameIdx = rawHeaders.indexOf('name');
    const brandIdx = rawHeaders.indexOf('brand');
    const catIdx = rawHeaders.indexOf('category');
    const costIdx = rawHeaders.indexOf('cost_price');
    const saleIdx = rawHeaders.indexOf('sale_price');
    const stockIdx = rawHeaders.indexOf('stock');
    const minStockIdx = rawHeaders.indexOf('min_stock');
    const unitIdx = rawHeaders.indexOf('unit_type');

    if (barcodeIdx === -1 || nameIdx === -1 || saleIdx === -1) {
      setParsingError(
        'El CSV debe contener al menos las columnas obligatorias: barcode, name, sale_price'
      );
      setParsedRows([]);
      return;
    }

    const rows: ParsedRow[] = [];

    // Parsear fila por fila
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Regex para separar respetando comillas
      const cells: string[] = [];
      let cur = '';
      let insideQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === separator && !insideQuotes) {
          cells.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      cells.push(cur.trim().replace(/^["']|["']$/g, ''));

      const barcodeVal = cells[barcodeIdx] || '';
      const nameVal = cells[nameIdx] || '';
      const brandVal = brandIdx !== -1 ? cells[brandIdx] : '';
      const catVal = catIdx !== -1 ? cells[catIdx] : '';
      const costVal = costIdx !== -1 ? parseFloat(cells[costIdx]?.replace(',', '.') || '0') : 0;
      const saleVal = saleIdx !== -1 ? parseFloat(cells[saleIdx]?.replace(',', '.') || '0') : 0;
      const stockVal = stockIdx !== -1 ? parseFloat(cells[stockIdx]?.replace(',', '.') || '0') : 0;
      const minStockVal = minStockIdx !== -1 ? parseFloat(cells[minStockIdx]?.replace(',', '.') || '5') : 5;
      const unitTypeRaw = (unitIdx !== -1 ? cells[unitIdx]?.toLowerCase() : 'unit') as UnitType;
      const unitType: UnitType = ['unit', 'kg', 'g', 'l', 'm'].includes(unitTypeRaw)
        ? unitTypeRaw
        : 'unit';
      const isWeighable = unitType === 'kg' || unitType === 'g' || unitType === 'l' || unitType === 'm';

      let isValid = true;
      let error = '';

      if (!barcodeVal) {
        isValid = false;
        error = 'Falta código de barras';
      } else if (!nameVal) {
        isValid = false;
        error = 'Falta nombre del producto';
      } else if (isNaN(saleVal) || saleVal < 0) {
        isValid = false;
        error = 'Precio de venta inválido';
      }

      rows.push({
        barcode: barcodeVal,
        name: nameVal,
        brand: brandVal,
        category: catVal,
        cost_price: isNaN(costVal) ? 0 : costVal,
        sale_price: isNaN(saleVal) ? 0 : saleVal,
        stock: isNaN(stockVal) ? 0 : stockVal,
        min_stock: isNaN(minStockVal) ? 5 : minStockVal,
        unit_type: unitType,
        is_weighable: isWeighable,
        isValid,
        error,
      });
    }

    setParsedRows(rows);
  }

  // Manejar selección de archivo
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCSVContent(content);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  }

  // Ejecutar importación masiva con upsert
  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setResultSummary(null);

    try {
      // 1. Obtener categorías existentes de la tienda
      const existingCategories = await fetchMarketCategories();
      const catMap = new Map<string, string>();
      existingCategories.forEach((c) => catMap.set(c.name.trim().toLowerCase(), c.id));

      // 2. Resolver o crear categorías ausentes
      const uniqueCategoryNames = Array.from(
        new Set(
          validRows
            .map((r) => r.category?.trim())
            .filter((c): c is string => Boolean(c && c.length > 0))
        )
      );

      for (const catName of uniqueCategoryNames) {
        const key = catName.toLowerCase();
        if (!catMap.has(key)) {
          try {
            const created = await createMarketCategory(catName);
            if (created) {
              catMap.set(key, created.id);
            }
          } catch (e) {
            console.warn(`No se pudo crear automáticamente categoría ${catName}`, e);
          }
        }
      }

      // 3. Preparar DTOs para batchUpsert
      const payload: CreateMarketProductInput[] = validRows.map((r) => {
        const catId = r.category ? catMap.get(r.category.trim().toLowerCase()) || null : null;
        return {
          barcode: r.barcode,
          name: r.name,
          brand: r.brand || null,
          category_id: catId,
          cost_price: r.cost_price,
          sale_price: r.sale_price,
          stock: r.stock,
          min_stock: r.min_stock,
          unit_type: r.unit_type,
          is_weighable: r.is_weighable,
          active: true,
        };
      });

      // 4. Ejecutar upsert en bloque
      const result = await batchUpsertMarketProducts(payload);
      setResultSummary(result);
      onCompleted();
    } catch (err: any) {
      console.error('Error importando CSV:', err);
      setResultSummary({
        inserted: 0,
        updated: 0,
        errors: [err.message || 'Error general al procesar lote CSV'],
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setParsedRows([]);
    setParsingError(null);
    setResultSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importación Masiva de Productos (CSV)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga o actualiza tu catálogo en masa con soporte de upsert inteligente por código de barras.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección de Instrucciones y Plantilla */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Formato admitido: CSV (delimitado por coma o punto y coma)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Si un producto ya existe con el mismo código de barras, se actualizará su precio, costo y stock automáticamente.
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-semibold text-xs shrink-0 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Zona de Drop / Carga de archivo */}
        {!file && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-emerald-500/5 group"
          >
            <Upload className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mx-auto transition-colors" />
            <p className="text-sm font-semibold text-slate-200 mt-3">
              Haz clic para seleccionar tu archivo CSV
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Archivos .csv hasta 10 MB (máx. 10.000 artículos por lote)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Error de Parseo */}
        {parsingError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parsingError}</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs underline font-semibold hover:text-white"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Previsualización del archivo cargado */}
        {file && parsedRows.length > 0 && !resultSummary && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">{file.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-semibold">
                  ✓ {validCount} válidos
                </span>
                {invalidCount > 0 && (
                  <span className="text-xs text-rose-400 font-semibold">
                    ✕ {invalidCount} con errores
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white underline ml-2"
                >
                  Cambiar archivo
                </button>
              </div>
            </div>

            {/* Vista previa de las primeras 5 filas */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Vista Previa de Filas (primeros registros):</span>
                <span className="text-[11px] text-slate-500">
                  Mostrando {Math.min(parsedRows.length, 5)} de {parsedRows.length} productos
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 font-semibold">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Nombre</th>
                      <th className="py-2.5 px-3 text-right">Costo</th>
                      <th className="py-2.5 px-3 text-right">Precio</th>
                      <th className="py-2.5 px-3 text-right">Stock</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? '' : 'bg-rose-500/5'}>
                        <td className="py-2 px-3 text-slate-400">{row.barcode}</td>
                        <td className="py-2 px-3 font-sans text-white font-medium truncate max-w-[180px]">
                          {row.name}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          ${row.cost_price.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          ${row.sale_price.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.stock} {row.unit_type}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                            {row.unit_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resumen Final de Resultados */}
        {resultSummary && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Importación Masiva Completada</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="block text-xl font-bold">{resultSummary.inserted}</span>
                <span>Productos nuevos insertados</span>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <span className="block text-xl font-bold">{resultSummary.updated}</span>
                <span>Productos existentes actualizados (Upsert)</span>
              </div>
            </div>
            {resultSummary.errors.length > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <span className="font-bold block mb-1">Observaciones / Errores:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {resultSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all"
          >
            {resultSummary ? 'Cerrar' : 'Cancelar'}
          </button>

          {!resultSummary && (
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando Lote...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Procesar e Importar {validCount} Productos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
