import { getCatalog } from '@/lib/catalog';
import NotebooksList from '@/components/NotebooksList';
import { Metadata } from 'next';
import { Navbar } from '@/components/sections/Navbar';

export const metadata: Metadata = {
  title: 'Catálogo de Equipos | JaTech',
  description: 'Explora nuestro catálogo de notebooks actualizados.',
};

export default async function NotebooksPage() {
  const catalog = await getCatalog();

  return (
    <main className="relative min-h-screen bg-obsidian text-slate-100 selection:bg-cyan-500/30 selection:text-white pt-24 pb-12">
      <Navbar />
      
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
        <div className="mb-10 border-b border-cyber-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-neon-cyan">devices</span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Catálogo de Equipos</h1>
          </div>
          <p className="text-on-surface-variant font-mono text-sm mt-2">
            Mostrando terminales de red disponibles. <span className="font-bold text-neon-cyan">Todos nuestros equipos son reacondicionados y cuentan con 3 meses de garantía.</span> 
            <span className="ml-2 text-neon-violet">Última sincronización: {new Date(catalog.generado * 1000).toLocaleString('es-AR')}</span>
          </p>
        </div>

        <NotebooksList products={catalog.productos} />
      </div>
    </main>
  );
}
