/**
 * Shared type definitions for service requests
 */

export interface ServiceRequestImage {
  id: string;
  data: string;
  mimeType: string;
  originalName: string;
}

export interface ServiceRequestPricing {
  total: number;
  subtotal?: number;
  tax?: number;
  [key: string]: unknown;
}

export interface ServiceRequestDetails {
  itemCount: number;
  marketplaces: string[];
  pricing?: ServiceRequestPricing;
  [key: string]: unknown;
}

export interface ServiceRequest {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  description?: string;
  type?: string;
  images?: ServiceRequestImage[];
  serviceDetails?: ServiceRequestDetails;
  [key: string]: unknown;
}

export interface Listing {
  seoTitle?: string;
  suggestedPrice?: number;
  keyFeatures?: string;
  [key: string]: unknown;
}
