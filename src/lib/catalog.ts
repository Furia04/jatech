export interface Product {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  precio_tarjeta: number;
  moneda: string;
  stock: number;
  disponible: boolean;
  condicion: string;
  grado: string;
  marca: string;
  imagen: string;
  imagenes: string[];
  link: string;
}

export interface CatalogFeed {
  vendedor: string;
  generado: number;
  moneda: string;
  productos: Product[];
}

export async function getCatalog(): Promise<CatalogFeed> {
  const url = 'https://jatech.offsalenotebook.com.ar/feed/6ce0f9a9c5880990cbbc159fe483531c.json';

  const defaultFeed: CatalogFeed = {
    vendedor: 'JaTech',
    generado: Math.floor(Date.now() / 1000),
    moneda: 'ARS',
    productos: [],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Catalog] Feed remoto respondió con status ${res.status}. Usando fallback resiliente.`);
      return defaultFeed;
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.productos)) {
      return defaultFeed;
    }

    return data;
  } catch (err: any) {
    console.warn('[Catalog] Error al obtener catálogo de notebooks remoto:', err?.message || err);
    return defaultFeed;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const catalog = await getCatalog();
    if (!catalog?.productos) return undefined;
    return catalog.productos.find((p) => p.id === id);
  } catch (e) {
    console.warn(`[Catalog] Error buscando producto ${id}:`, e);
    return undefined;
  }
}
