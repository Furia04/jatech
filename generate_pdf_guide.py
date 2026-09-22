import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas de ReportLab de 2 pasadas para numeración de páginas y pie corporativo."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header en páginas superiores a la 1
        if self._pageNumber > 1:
            self.drawString(40, 810, "Manual de Procedimientos y Guía Técnica • JaTech SAT")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(40, 804, 555, 804)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 35, 555, 35)
        
        footer_text = "Sistema JaTech SAT • Confidencial - Uso Interno del Taller"
        self.drawString(40, 24, footer_text)
        
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(555, 24, page_str)
        self.restoreState()

def build_pdf(filename):
    # Margen de 40 pt (1.4 cm)
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Colores corporativos
    c_primary = colors.HexColor("#0284C7")      # Cyan / Azul primario
    c_dark = colors.HexColor("#0F172A")         # Azul marino oscuro
    c_text = colors.HexColor("#334155")         # Texto base
    c_muted = colors.HexColor("#64748B")        # Texto secundario
    c_bg_light = colors.HexColor("#F8FAFC")     # Fondo claro
    c_border = colors.HexColor("#E2E8F0")       # Bordes
    c_success = colors.HexColor("#10B981")      # Verde éxito
    c_warning = colors.HexColor("#F59E0B")      # Ámbar alerta

    # Estilos tipográficos
    style_h1 = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=colors.white
    )
    
    style_subtitle = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#BAE6FD")
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_dark,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h3 = ParagraphStyle(
        'SectionH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_text,
        alignment=4 # Justified
    )

    style_body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark
    )

    style_bullet = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_text,
        leftIndent=12,
        firstLineIndent=-8
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_dark
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10,
        textColor=c_text
    )

    style_alert = ParagraphStyle(
        'AlertText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor("#1E3A8A")
    )

    elements = []

    # ==========================================
    # 1. ENCABEZADO / BANNER PRINCIPAL
    # ==========================================
    banner_content = [
        [
            Paragraph("<b>MANUAL DE PROCEDIMIENTOS Y GUÍA TÉCNICA</b>", style_h1),
            Paragraph("<font size=7 color='#38BDF8'><b>VERSIÓN 2.0 • 2026</b><br/>Multi-Tenant SAT</font>", ParagraphStyle('VerBadge', parent=style_body, alignment=2))
        ],
        [
            Paragraph("Sistema de Gestión de Taller SAT • Plataforma Web & App Móvil Android", style_subtitle),
            Paragraph("", style_body)
        ]
    ]
    banner_table = Table(banner_content, colWidths=[380, 135])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_dark),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINELEFT', (0, 0), (0, -1), 4, c_primary),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 10))

    # ==========================================
    # 2. ACCESO, SEGURIDAD Y PERFILES
    # ==========================================
    elements.append(Paragraph("1. Acceso, Seguridad y Perfil Técnico", style_h2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=1, spaceAfter=6))
    
    p_intro = Paragraph(
        "El sistema cuenta con arquitectura en la nube (Supabase Cloud) con aislamiento multi-taller y perfiles de usuario diferenciados para proteger la privacidad operativa y financiera.",
        style_body
    )
    elements.append(p_intro)
    elements.append(Spacer(1, 4))

    roles_data = [
        [
            Paragraph("<b>🔐 Rol Técnico (Operativo):</b><br/>Acceso a recepción, diagnóstico, actualización de órdenes, solicitud de repuestos y registro de presupuestos. Los costos de compra de repuestos y balances financieros generales se mantienen ocultos para técnicos sin permiso explícito.", style_body),
            Paragraph("<b>📱 App Android & Panel Web:</b><br/>Tanto la computadora de mesón como la aplicación nativa en Android sincronizan automáticamente en tiempo real. Cualquier cambio realizado desde el celular impacta de inmediato en el taller.", style_body)
        ]
    ]
    roles_table = Table(roles_data, colWidths=[250, 255])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.8, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(roles_table)
    elements.append(Spacer(1, 10))

    # ==========================================
    # 3. RECEPCIÓN DE EQUIPOS Y NUEVA ORDEN SAT
    # ==========================================
    elements.append(Paragraph("2. Recepción de Equipos y Nueva Orden SAT", style_h2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=1, spaceAfter=6))
    
    p_rec = Paragraph(
        "La recepción es el momento clave para documentar el estado físico de los equipos y evitar discrepancias posteriores con el cliente:",
        style_body
    )
    elements.append(p_rec)
    elements.append(Spacer(1, 4))

    steps_data = [
        [
            Paragraph("<font color='#0284C7'><b>Paso 1</b></font><br/><b>Cliente Nuevo o Existente</b>", style_table_header),
            Paragraph("• <b>Nuevo:</b> Ingresa Nombre, Teléfono (WhatsApp) y DNI/Documento. Se registra automáticamente.<br/>• <b>Existente:</b> Búscalo por Nombre, DNI o Teléfono. Se cargan sus datos y sus equipos anteriores listos para asociar con 1 clic.", style_body)
        ],
        [
            Paragraph("<font color='#0284C7'><b>Paso 2</b></font><br/><b>Inspección & Falla</b>", style_table_header),
            Paragraph("• <b>Rubro:</b> Smartphone, Notebook/PC, TV/Audio, Automotor/ECU, etc.<br/>• <b>Marca y Modelo:</b> Selección predictiva con sugerencias inteligentes.<br/>• <b>Falla Reportada:</b> Descripción exacta del problema según el cliente.<br/>• <b>Patrón / Clave:</b> Grilla táctil (1 a 9) o PIN de desbloqueo.<br/>• <b>Fotos de Recepción:</b> Evidencia fotográfica de golpes, rayones o roturas.", style_body)
        ],
        [
            Paragraph("<font color='#0284C7'><b>Paso 3</b></font><br/><b>Finanzas & Comprobantes</b>", style_table_header),
            Paragraph("• <b>Seña / Anticipo:</b> Registro del monto a cuenta y método de pago.<br/>• <b>Comanda Térmica (80mm):</b> Impresión con código <font name='Helvetica-Bold'>#WO-XXXX</font> y código QR.<br/>• <b>Notificación WhatsApp:</b> Envío inmediato del link de seguimiento al cliente.", style_body)
        ]
    ]
    steps_table = Table(steps_data, colWidths=[130, 385])
    steps_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.8, c_border),
        ('BACKGROUND', (0, 0), (0, -1), c_bg_light),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(steps_table)
    elements.append(Spacer(1, 12))

    # ==========================================
    # 4. CICLO DE VIDA Y ESTADOS DE REPARACIÓN
    # ==========================================
    elements.append(Paragraph("3. Ciclo de Vida y Estados de una Orden de Servicio", style_h2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=1, spaceAfter=6))
    
    status_data = [
        [
            Paragraph("<b>Estado Oficial</b>", style_table_header),
            Paragraph("<b>Acción Técnica Requerida</b>", style_table_header),
            Paragraph("<b>Impacto en Portal Público / Cliente</b>", style_table_header)
        ],
        [
            Paragraph("<font color='#0369A1'><b>RECIBIDO</b></font>", style_table_cell),
            Paragraph("Equipo ingresado en mesón de entrada pendiente de peritaje.", style_table_cell),
            Paragraph("Paso 1: Notifica recepción y código de orden asignado.", style_table_cell)
        ],
        [
            Paragraph("<font color='#B45309'><b>EN REVISIÓN</b></font>", style_table_cell),
            Paragraph("Técnico en banco de pruebas desmontando y diagnosticando.", style_table_cell),
            Paragraph("Paso 2: Informa que el laboratorio está evaluando la falla.", style_table_cell)
        ],
        [
            Paragraph("<font color='#86198F'><b>ESPERANDO REPUESTO</b></font>", style_table_cell),
            Paragraph("Se solicitó pieza o componente a distribuidor/proveedor.", style_table_cell),
            Paragraph("Informa demora justificada por envío de repuesto.", style_table_cell)
        ],
        [
            Paragraph("<font color='#C2410C'><b>ESPERANDO CLIENTE</b></font>", style_table_cell),
            Paragraph("Presupuesto emitido o consulta técnica pendiente de confirmación.", style_table_cell),
            Paragraph("Alerta al cliente para confirmar presupuesto o clave.", style_table_cell)
        ],
        [
            Paragraph("<font color='#15803D'><b>PARA ENTREGAR (LISTO)</b></font>", style_table_cell),
            Paragraph("Reparación finalizada y test de calidad (QC) aprobado.", style_table_cell),
            Paragraph("Paso 3: Notifica al cliente que puede retirar el equipo.", style_table_cell)
        ],
        [
            Paragraph("<font color='#475569'><b>ENTREGADO</b></font>", style_table_cell),
            Paragraph("Equipo retirado por el cliente, cobrado y garantía activada.", style_table_cell),
            Paragraph("Paso 4: Cierra la orden y emite comprobante digital final.", style_table_cell)
        ]
    ]
    status_table = Table(status_data, colWidths=[120, 205, 190])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(status_table)
    elements.append(Spacer(1, 6))

    tip_box = [
        [
            Paragraph("<b>💡 Tip Operativo:</b> Al pasar una orden a <b>'Para Entregar'</b> o <b>'Entregado'</b>, utiliza la calculadora de presupuesto para registrar los repuestos utilizados. Esto descuenta automáticamente el inventario del taller.", style_alert)
        ]
    ]
    t_tip = Table(tip_box, colWidths=[515])
    t_tip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ('LINELEFT', (0, 0), (0, -1), 3.5, c_primary),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_tip)
    elements.append(Spacer(1, 10))

    # ==========================================
    # 5. INVENTARIO Y PEDIDOS DE REPUESTOS
    # ==========================================
    elements.append(Paragraph("4. Gestión de Repuestos, Stock y Pedidos a Proveedores", style_h2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=1, spaceAfter=6))
    
    parts_data = [
        [
            Paragraph("<b>📦 Control de Inventario de Taller:</b><br/>"
                      "• <b>Stock Físico vs. Reservado:</b> El sistema contabiliza repuestos en estante y repuestos 'en custodia' (instalados en equipos en proceso de trabajo).<br/>"
                      "• <b>Ajustes Rápidos:</b> Botones <font color='#0284C7'>[ + ]</font> y <font color='#0284C7'>[ - ]</font> en la tabla para ajuste ágil de unidades.<br/>"
                      "• <b>Eliminación Segura:</b> Botón de papelera con confirmación para retirar ítems obsoletos.", style_body),
            Paragraph("<b>🛍️ Pedidos de Repuestos (Encargos):</b><br/>"
                      "• <b>Asignación de Cliente:</b> Elige cliente nuevo o existente con buscador predictivo.<br/>"
                      "• <b>Autocompletar Modelo:</b> Clic en el chip del equipo registrado para autollenar marca y modelo.<br/>"
                      "• <b>Aviso Automático de Llegada:</b> Al marcar estado <i>'Llegó al Taller'</i>, se habilita el botón de WhatsApp directo para convocar al cliente.", style_body)
        ]
    ]
    parts_table = Table(parts_data, colWidths=[250, 255])
    parts_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.8, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(parts_table)
    elements.append(Spacer(1, 10))

    # ==========================================
    # 6. TRABAJOS EXTRA & PROTOCOLO DE CALIDAD
    # ==========================================
    elements.append(Paragraph("5. Trabajos Extra, Garantías y Protocolo de Calidad", style_h2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=1, spaceAfter=6))
    
    final_data = [
        [
            Paragraph("<b>🔧 Trabajos Extra / Visitas (EXT-00X):</b><br/>"
                      "Para instalaciones de cámaras, redes, formateos o servicios en domicilio:<br/>"
                      "• Código correlativo generado automáticamente.<br/>"
                      "• Desglose de Mano de Obra + Materiales + Seña.<br/>"
                      "• Impresión de ticket y envío por WhatsApp.", style_body),
            Paragraph("<b>✅ Checklist de Control de Calidad (QC):</b><br/>"
                      "Antes de marcar un equipo como <i>Listo / Para Entregar</i>:<br/>"
                      "1. Verificar encendido, carga, táctil, cámaras, audio y Wi-Fi.<br/>"
                      "2. Estipular período de garantía (ej: 90 días).<br/>"
                      "3. Confirmar saldo restante a cobrar restando la seña.<br/>"
                      "4. Entregar equipo y activar estado <i>Entregado</i>.", style_body)
        ]
    ]
    final_table = Table(final_data, colWidths=[250, 255])
    final_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.8, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(final_table)

    # Construir el documento PDF
    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {filename}")

if __name__ == '__main__':
    out_path = sys.argv[1] if len(sys.argv) > 1 else "Guia_de_Uso_Tecnicos_JaTech_SAT.pdf"
    build_pdf(out_path)
