import { getProductById, getCatalog } from '@/lib/catalog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/sections/Navbar';
import ProductGallery from '@/components/ProductGallery';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return { title: 'Terminal No Encontrada' };
  return {
    title: `${product.titulo} | JaTech`,
    description: product.descripcion,
  };
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.productos.map((product) => ({
    id: product.id,
  }));
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-obsidian text-slate-100 selection:bg-cyan-500/30 selection:text-white pt-24 pb-12">
      <Navbar />
      
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
        <div className="mb-8">
          <Link href="/notebooks" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors flex items-center gap-2 font-mono text-sm uppercase tracking-wider w-fit group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Volver al catálogo
          </Link>
        </div>

        <div className="bg-surface-container rounded-2xl shadow-lg border border-cyber-border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
            
            {/* Galería Visual */}
            <ProductGallery 
              images={product.imagenes && product.imagenes.length > 0 ? product.imagenes : [product.imagen]} 
              title={product.titulo}
              marca={product.marca}
              grado={product.grado}
            />

            {/* Panel de Datos */}
            <div className="p-6 lg:p-10 flex flex-col">
              <div className="mb-4">
                <div className="text-neon-violet font-mono text-xs tracking-widest uppercase mb-2">ID: {product.id}</div>
                <h1 className="text-3xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight leading-tight">{product.titulo}</h1>
              </div>
              
              <div className="space-y-4 mb-8">
                <h3 className="font-mono text-on-surface-variant text-sm uppercase tracking-wider border-b border-cyber-border pb-2">Especificaciones</h3>
                <p className="text-on-surface text-lg leading-relaxed font-sans bg-surface-container-low p-4 rounded-lg border border-surface-variant">
                  {product.descripcion}
                </p>
              </div>

              <div className="bg-surface-container-highest p-6 rounded-xl border border-cyber-border mb-8 shadow-inner">
                <div className="flex items-start gap-3 mb-6 bg-surface-container-low p-4 rounded border border-outline/50">
                  <span className="material-symbols-outlined text-neon-cyan">verified</span>
                  <div>
                    <h4 className="text-on-surface font-bold text-sm">Equipo Reacondicionado Certificado</h4>
                    <p className="text-on-surface-variant text-sm mt-1">Este equipo ha sido revisado y puesto a punto por nuestros técnicos. Incluye <strong>3 meses de garantía</strong> cubierta por JaTech.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-primary mb-1 uppercase tracking-wider">Precio Especial (Transf/Efvo)</div>
                    <div className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter">
                      ${product.precio.toLocaleString('es-AR')}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-xs font-mono text-on-surface-variant mb-1">Precio Tarjeta</div>
                    <div className="text-xl font-bold text-on-surface-variant line-through opacity-70">
                      ${product.precio_tarjeta.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                {product.disponible ? (
                  <a 
                    href={`https://wa.me/TUNUMERODEWHATSAPP?text=Hola,%20me%20interesa%20el%20equipo%20${encodeURIComponent(product.titulo)}%20(ID:%20${product.id})`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-center bg-primary hover:bg-primary-container text-on-primary font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] font-sans text-lg"
                  >
                    <span className="material-symbols-outlined">forum</span>
                    Iniciar Protocolo de Compra
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full text-center bg-surface-variant border border-outline text-on-surface-variant font-bold py-4 px-6 rounded-xl font-sans text-lg cursor-not-allowed">
                    <span className="material-symbols-outlined">block</span>
                    Unidad Fuera de Línea (Sin Stock)
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
