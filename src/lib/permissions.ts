import { InventoryItem, ServiceOrder, UserProfile } from '@/types';

/**
 * Comprueba si un usuario tiene permisos para ver montos financieros, costos e ingresos.
 * El 'owner' siempre tiene acceso. El 'technician' solo tiene acceso si 'can_view_financials' está activo.
 */
export function hasFinancialAccess(user: UserProfile): boolean {
  if (user.role === 'owner') return true;
  return Boolean(user.can_view_financials);
}

/**
 * Oculta datos de costo y estimados de una orden de servicio si el usuario no tiene permisos financieros.
 */
export function sanitizeServiceOrder(order: ServiceOrder, user: UserProfile): ServiceOrder {
  if (hasFinancialAccess(user)) return order;

  return {
    ...order,
    estimated_cost: undefined,
    internal_notes: undefined, // Ocultar notas financieras/internas del taller
  };
}

/**
 * Oculta costo de repuestos y márgenes de ganancia en el inventario para técnicos sin permiso.
 */
export function sanitizeInventoryItem(item: InventoryItem, user: UserProfile): InventoryItem {
  if (hasFinancialAccess(user)) return item;

  return {
    ...item,
    cost: undefined,
  };
}
