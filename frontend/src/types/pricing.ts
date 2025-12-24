/**
 * Pricing type definitions
 */

export interface Pricing {
  basePrice?: number;
  totalPrice?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  [key: string]: unknown;
}
