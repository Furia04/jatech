import { NextRequest, NextResponse } from 'next/server';
import phonesData from '@/data/phones.json';

interface PhoneResult {
  id: string;
  brand: string;
  model: string;
  full_name: string;
}

const LOCAL_PHONE_CATALOG = phonesData as PhoneResult[];

function cleanString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function filterCatalog(query: string, brandFilter: string): PhoneResult[] {
  const cleanQuery = cleanString(query);
  const cleanBrand = cleanString(brandFilter);
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  return LOCAL_PHONE_CATALOG.filter((phone) => {
    const cleanPhoneBrand = cleanString(phone.brand);
    const cleanPhoneModel = cleanString(phone.model);
    const cleanPhoneFull = cleanString(phone.full_name);
    const fullTextLower = `${phone.brand} ${phone.model} ${phone.full_name}`.toLowerCase();

    // Si hay filtro de marca explícito, verificar coincidencia de marca
    if (cleanBrand) {
      const matchesBrandFilter =
        cleanPhoneBrand.includes(cleanBrand) || cleanBrand.includes(cleanPhoneBrand);
      if (!matchesBrandFilter) return false;
    }

    if (!query) return true;

    // 1. Coincidencia limpia sin espacios (ej: "a 12" -> "a12" coincide con "galaxya12")
    if (cleanQuery && (cleanPhoneFull.includes(cleanQuery) || cleanPhoneModel.includes(cleanQuery))) {
      return true;
    }

    // 2. Coincidencia por tokens (todas las palabras de la consulta deben estar presentes)
    return queryTokens.every((token) => {
      const cleanToken = cleanString(token);
      return (
        fullTextLower.includes(token) ||
        (cleanToken.length > 0 && cleanPhoneFull.includes(cleanToken))
      );
    });
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const brandFilter = searchParams.get('brand')?.trim() || '';

  if (!query && !brandFilter) {
    return NextResponse.json(
      {
        results: LOCAL_PHONE_CATALOG.slice(0, 30),
        source: 'local_database',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  // 1. Intentar buscar con el filtro de marca
  let results = filterCatalog(query, brandFilter);

  // 2. Si con el filtro de marca no hay resultados (ej: se tenía la marca "Apple" seleccionada pero se buscó "A12"),
  //    reintentar sin restricción de marca para no dejar la lista vacía al usuario
  if (results.length === 0 && brandFilter && query) {
    results = filterCatalog(query, '');
  }

  return NextResponse.json(
    {
      results: results.slice(0, 150), // Permitir ver todos los modelos de la marca
      source: 'local_database',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
