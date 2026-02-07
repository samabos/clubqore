import { apiClient } from './base';
import { Address } from '@/types/common';

export interface PostcodeValidationResponse {
  valid: boolean;
  postcode: string;
}

export interface AddressSuggestion {
  address: string;  // Full display address with house number
  id: string;       // Unique ID for fetching full details
  url?: string;     // Optional URL from getAddress.io
}

/**
 * Lookup full address details for a UK postcode
 */
export async function lookupPostcode(postcode: string): Promise<Address> {
  try {
    const response = await apiClient(
      `/api/postcodes/lookup/${encodeURIComponent(postcode)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to lookup postcode');
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error - could not connect to postcode service');
  }
}

/**
 * Get autocomplete suggestions for a partial UK postcode
 */
export async function autocompletePostcode(partial: string): Promise<string[]> {
  try {
    if (!partial || partial.length < 2) {
      return [];
    }

    const response = await apiClient(
      `/api/postcodes/autocomplete/${encodeURIComponent(partial)}`
    );

    if (!response.ok) {
      console.warn('Autocomplete failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error: unknown) {
    // Return empty array on errors (better UX for autocomplete)
    console.warn('Autocomplete error:', error);
    return [];
  }
}

/**
 * Validate if a UK postcode exists
 */
export async function validatePostcode(postcode: string): Promise<boolean> {
  try {
    const response = await apiClient(
      `/api/postcodes/validate/${encodeURIComponent(postcode)}`
    );

    if (!response.ok) {
      console.warn('Validation failed:', response.status);
      return false;
    }

    const data: PostcodeValidationResponse = await response.json();
    return data.valid;
  } catch (error: unknown) {
    console.warn('Validation error:', error);
    return false;
  }
}

/**
 * Normalize UK postcode to uppercase with space
 */
export function normalizePostcode(postcode: string): string {
  if (!postcode) return '';

  // Remove all spaces and convert to uppercase
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();

  // Add space before last 3 characters (e.g., SW1A1AA -> SW1A 1AA)
  if (cleaned.length >= 5) {
    return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3);
  }

  return cleaned;
}

/**
 * Validate UK postcode format (client-side)
 */
export function isValidPostcodeFormat(postcode: string): boolean {
  if (!postcode) return false;

  // UK postcode regex pattern
  const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
}

/**
 * Search for UK addresses with autocomplete (including house numbers)
 * Uses getAddress.io API for full address suggestions
 */
export async function searchAddresses(searchTerm: string): Promise<AddressSuggestion[]> {
  try {
    if (!searchTerm || searchTerm.length < 3) {
      return [];
    }

    const response = await apiClient(
      `/api/postcodes/search/${encodeURIComponent(searchTerm)}`
    );

    if (!response.ok) {
      console.warn('Address search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error: unknown) {
    // Return empty array on errors (better UX for autocomplete)
    console.warn('Address search error:', error);
    return [];
  }
}

/**
 * Get full address details by ID from getAddress.io
 * Returns complete address with all fields populated including street/building number
 */
export async function getFullAddress(addressId: string): Promise<Address> {
  try {
    const response = await apiClient(
      `/api/postcodes/address/${encodeURIComponent(addressId)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve address');
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error - could not retrieve address');
  }
}

export const postcodeAPI = {
  lookup: lookupPostcode,
  autocomplete: autocompletePostcode,
  validate: validatePostcode,
  normalize: normalizePostcode,
  isValidFormat: isValidPostcodeFormat,
  searchAddresses: searchAddresses,
  getFullAddress: getFullAddress
};
