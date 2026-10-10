# Interface Design System: Obsidian Glass

## Intent
Un sistema de reservas multi-tenant B2B. 
- **Dueños (B2B):** Necesitan gestionar su agenda rápidamente. Sensación utilitaria, confiable, sin distracciones.
- **Clientes (B2C):** Necesitan reservar con fricción mínima. Sensación premium y fluida.

## Depth Strategy & Spacing
- **Depth:** Architectural Glass. No usamos drop shadows duras. La elevación se logra mediante `backdrop-blur-xl`, fondos semi-transparentes (`rgba(20,20,22,0.4)`) y bordes muy sutiles (`rgba(255,255,255,0.08)`).
- **Spacing Base:** Sistema de 4px y 8px. Densidad media-alta para dashboards B2B, ligeramente más suelto (airy) para la vista B2C.

## Hierarchy & Typography
- **Type Scale Ratio:** ~1.25. (Ej. 11px uppercase label, 14px body, 18px h3, 24px h2).
- **Levers:** El peso visual (font-weight) y color (blanco vs gris apagado) importan más que el tamaño.
- **Tipografía:** Sans-serif geométrica limpia (Inter o system-ui). Tabular-nums para todas las horas, fechas y números.

## Palette (Dark Mode Base)
- **Background:** `#0a0a0c` (Obsidian) con gradientes de fondo extremadamente sutiles (opacity 5-10%) para alimentar el efecto de cristal.
- **Surface (Glass):** `rgba(255,255,255,0.03)` base, `rgba(255,255,255,0.06)` en hover.
- **Borders:** `rgba(255,255,255,0.08)`.
- **Text:** Primary (`#e2e8f0`), Muted (`#83838a`).
- **Accent:** Azul pálido/técnico (`#3b82f6`) o tonos esmeralda para estados positivos.

## Component Patterns
- **Tarjetas / Paneles:** Contenedores de cristal con bordes internos de 1px.
- **Estados:** Todo elemento interactivo DEBE tener estado `:hover` (cambio sutil de opacidad de fondo), `:active` (`scale-95` o `scale-[0.98]`) y `:focus` (anillo de foco limpio).
