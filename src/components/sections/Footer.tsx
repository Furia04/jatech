import React from "react";
import { Cpu, MessageSquare } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#030306] relative z-10 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="font-bold text-white text-base tracking-wide">JATECH</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Servicio técnico de notebooks y computadoras, impresiones 3D a medida y desarrollo de
            páginas web efectivas para tu negocio.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Servicio Técnico &amp; 3D
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>Reparación de Notebooks y PC</li>
            <li>Diagnóstico de Placas y Componentes</li>
            <li>Impresión 3D a Medida</li>
            <li>Venta Minorista y Mayorista 3D</li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Web &amp; Software
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>Landing Pages de Alta Conversión</li>
            <li>Sitios Web para Negocios</li>
            <li>Software según tus Requisitos</li>
            <li>Mantenimiento y Soporte Web</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Atención Rápida
          </h4>
          <p className="text-slate-400 text-xs mb-3 leading-relaxed">
            ¿Tenés alguna consulta o presupuesto urgente? Escribinos directamente.
          </p>
          <a
            href="https://wa.me/5492645045411?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp Directo
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
        <span>&copy; {new Date().getFullYear()} JATECH. Todos los derechos reservados.</span>
        <span>Calidad, rapidez y confianza en cada trabajo.</span>
      </div>
    </footer>
  );
};
