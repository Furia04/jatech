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
  
  // ISR: Revalidar cada 1 hora (3600 segundos) para que se actualice solo
  const res = await fetch(url, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener el catálogo de notebooks');
  }

  return res.json();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.productos.find(p => p.id === id);
}
