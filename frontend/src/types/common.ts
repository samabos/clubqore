export interface Address {
    street: string;      // User input
    city: string;        // From admin_district
    county: string;      // From region (UK terminology)
    postcode: string;    // UK postcode (uppercase, normalized)
    country: string;     // England/Scotland/Wales/Northern Ireland
}

// Legacy address format (for backward compatibility during migration)
export type AddressLegacy = {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

// Type guard to check if address is new format
export function isNewAddress(addr: unknown): addr is Address {
    return Boolean(addr) &&
           typeof addr === 'object' &&
           addr !== null &&
           'county' in addr &&
           'postcode' in addr &&
           !('state' in addr) &&
           !('zipCode' in addr);
}

// Normalize address from either format to new format
export function normalizeAddress(addr: Address | AddressLegacy | string | null | undefined): Address | null {
    if (!addr) return null;

    // If it's a string, return null (can't normalize)
    if (typeof addr === 'string') return null;

    // If it's already new format, return as is
    if (isNewAddress(addr)) {
        return addr as Address;
    }

    // Convert from legacy format
    const legacy = addr as AddressLegacy;
    return {
        street: legacy.street || '',
        city: legacy.city || '',
        county: legacy.state || '', // Map state to county
        postcode: legacy.zipCode || '', // Map zipCode to postcode
        country: legacy.country || 'England'
    };
}