import axios from 'axios';

const POSTCODES_IO_BASE_URL = 'https://api.postcodes.io';
const GETADDRESS_IO_BASE_URL = 'https://api.getAddress.io';
const GETADDRESS_API_KEY = process.env.GETADDRESS_API_KEY;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const cache = new Map();

/**
 * Get cached data if not expired
 */
function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set cache entry
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Normalize UK postcode to uppercase with space
 */
function normalizePostcode(postcode) {
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
 * Validate UK postcode format
 */
function isValidPostcodeFormat(postcode) {
  if (!postcode) return false;

  // UK postcode regex pattern
  const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
}

/**
 * Map Postcodes.io API response to Address object
 */
function mapToAddress(apiResponse) {
  if (!apiResponse || !apiResponse.result) {
    return null;
  }

  const result = apiResponse.result;

  return {
    street: '', // User will need to input this
    city: result.admin_district || result.parliamentary_constituency || '',
    county: result.region || result.admin_county || '',
    postcode: result.postcode,
    country: result.country || 'England'
  };
}

/**
 * Lookup full address details for a postcode
 */
export async function lookupPostcode(postcode) {
  if (!postcode) {
    throw new Error('Postcode is required');
  }

  const normalized = normalizePostcode(postcode);

  if (!isValidPostcodeFormat(normalized)) {
    throw new Error('Invalid postcode format');
  }

  // Check cache first
  const cacheKey = `lookup:${normalized}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(
      `${POSTCODES_IO_BASE_URL}/postcodes/${encodeURIComponent(normalized)}`,
      {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      }
    );

    if (response.status === 404) {
      throw new Error('Postcode not found');
    }

    if (response.status !== 200 || !response.data) {
      throw new Error('Failed to lookup postcode');
    }

    const address = mapToAddress(response.data);

    if (!address) {
      throw new Error('Invalid response from postcode API');
    }

    // Cache the result
    setCache(cacheKey, address);

    return address;
  } catch (error) {
    if (error.message === 'Postcode not found' || error.message === 'Invalid postcode format') {
      throw error;
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Postcode lookup service timed out');
    }

    if (axios.isAxiosError(error)) {
      throw new Error('Postcode lookup service is unavailable');
    }

    throw new Error('Failed to lookup postcode');
  }
}

/**
 * Get autocomplete suggestions for partial postcode
 */
export async function autocompletePostcode(partial) {
  if (!partial) {
    return [];
  }

  const normalized = partial.replace(/\s/g, '').toUpperCase();

  if (normalized.length < 2) {
    return [];
  }

  // Check cache first
  const cacheKey = `autocomplete:${normalized}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(
      `${POSTCODES_IO_BASE_URL}/postcodes/${encodeURIComponent(normalized)}/autocomplete`,
      {
        timeout: 5000,
        validateStatus: (status) => status < 500
      }
    );

    if (response.status === 404 || !response.data || !response.data.result) {
      return [];
    }

    if (response.status !== 200) {
      return [];
    }

    const suggestions = response.data.result || [];

    // Cache the results
    setCache(cacheKey, suggestions);

    return suggestions;
  } catch (error) {
    // Return empty array on errors for autocomplete
    // (better UX than showing errors during typing)
    console.warn('Autocomplete error:', error.message);
    return [];
  }
}

/**
 * Validate if a postcode exists
 */
export async function validatePostcode(postcode) {
  if (!postcode) {
    return false;
  }

  const normalized = normalizePostcode(postcode);

  if (!isValidPostcodeFormat(normalized)) {
    return false;
  }

  try {
    const response = await axios.get(
      `${POSTCODES_IO_BASE_URL}/postcodes/${encodeURIComponent(normalized)}/validate`,
      {
        timeout: 5000,
        validateStatus: (status) => status < 500
      }
    );

    return response.status === 200 && response.data && response.data.result === true;
  } catch (error) {
    return false;
  }
}

/**
 * Search for addresses with house numbers using getAddress.io
 * Returns autocomplete suggestions with full addresses including building numbers
 */
export async function searchAddresses(searchTerm) {
  if (!searchTerm || searchTerm.length < 3) {
    return [];
  }

  if (!GETADDRESS_API_KEY) {
    console.warn('GETADDRESS_API_KEY not configured, falling back to manual entry');
    return [];
  }

  // Check cache first
  const cacheKey = `getaddress:search:${searchTerm.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(
      `${GETADDRESS_IO_BASE_URL}/autocomplete/${encodeURIComponent(searchTerm)}`,
      {
        params: { 'api-key': GETADDRESS_API_KEY },
        timeout: 5000,
        validateStatus: (status) => status < 500
      }
    );

    if (response.status !== 200 || !response.data) {
      return [];
    }

    const suggestions = response.data.suggestions || [];

    // Cache the results
    setCache(cacheKey, suggestions);

    return suggestions;
  } catch (error) {
    console.warn('getAddress.io search error:', error.message);
    return [];
  }
}

/**
 * Get full address details by ID from getAddress.io
 * Returns structured address with all fields populated including street/building number
 */
export async function getFullAddress(addressId) {
  if (!addressId) {
    throw new Error('Address ID is required');
  }

  if (!GETADDRESS_API_KEY) {
    throw new Error('getAddress.io API key not configured');
  }

  // Check cache first
  const cacheKey = `getaddress:full:${addressId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(
      `${GETADDRESS_IO_BASE_URL}/get/${encodeURIComponent(addressId)}`,
      {
        params: { 'api-key': GETADDRESS_API_KEY },
        timeout: 5000,
        validateStatus: (status) => status < 500
      }
    );

    if (response.status === 404) {
      throw new Error('Address not found');
    }

    if (response.status !== 200 || !response.data) {
      throw new Error('Failed to retrieve address');
    }

    const data = response.data;

    // Map getAddress.io response to our Address format
    const address = {
      street: data.line_1 || '', // Includes building number + street name
      city: data.town_or_city || '',
      county: data.county || '',
      postcode: data.postcode || '',
      country: data.country || 'England'
    };

    // Cache the result
    setCache(cacheKey, address);

    return address;
  } catch (error) {
    if (error.message === 'Address not found') {
      throw error;
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Address lookup service timed out');
    }

    if (axios.isAxiosError(error)) {
      throw new Error('Address lookup service is unavailable');
    }

    throw new Error('Failed to retrieve address');
  }
}

export const postcodeService = {
  lookupPostcode,
  autocompletePostcode,
  validatePostcode,
  normalizePostcode,
  isValidPostcodeFormat,
  searchAddresses,
  getFullAddress
};
