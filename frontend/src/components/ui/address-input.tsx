import React, { useState, useEffect, useCallback } from 'react';
import { Address } from '@/types/common';
import { postcodeAPI, AddressSuggestion } from '@/api/postcode';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from './utils';
import { Loader2, Search, Edit, MapPin } from 'lucide-react';

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface AddressInputProps {
  value: Address | null;
  onChange: (address: Address | null) => void;
  required?: boolean;
  disabled?: boolean;
  showManualEntry?: boolean;
  defaultToManual?: boolean;
  className?: string;
  error?: string;
  name?: string;
}

type InputMode = 'search' | 'manual' | 'display';

const UK_COUNTRIES = ['England', 'Scotland', 'Wales', 'Northern Ireland'] as const;

export function AddressInput({
  value,
  onChange,
  required = false,
  disabled = false,
  showManualEntry = true,
  defaultToManual = false,
  className,
  error,
  name = 'address'
}: AddressInputProps) {
  const [mode, setMode] = useState<InputMode>(
    defaultToManual ? 'manual' : (value ? 'display' : 'search')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualAddress, setManualAddress] = useState<Address>(
    value || {
      street: '',
      city: '',
      county: '',
      postcode: '',
      country: 'England'
    }
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch autocomplete suggestions with full addresses (getAddress.io)
  useEffect(() => {
    if (mode !== 'search' || !debouncedSearchQuery || debouncedSearchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const results = await postcodeAPI.searchAddresses(debouncedSearchQuery);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.warn('Failed to fetch address suggestions:', error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery, mode]);

  const handlePostcodeSearch = async (postcode: string) => {
    setIsLoading(true);
    setSearchError(null);

    try {
      const address = await postcodeAPI.lookup(postcode);
      setManualAddress(address);
      onChange(address);
      setMode('display');
      setShowSuggestions(false);
    } catch (error: any) {
      setSearchError(error.message || 'Failed to lookup postcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    setShowSuggestions(false);
    setIsLoadingAddress(true);
    setSearchError(null);

    try {
      // Fetch full address details using the suggestion ID
      const fullAddress = await postcodeAPI.getFullAddress(suggestion.id);
      setManualAddress(fullAddress);
      onChange(fullAddress);
      setMode('display');
    } catch (error: any) {
      setSearchError(error.message || 'Failed to load address');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleManualSubmit = () => {
    // Validate required fields
    if (required && (!manualAddress.postcode || !manualAddress.country)) {
      setSearchError('Postcode and country are required');
      return;
    }

    // Validate postcode format
    if (manualAddress.postcode && !postcodeAPI.isValidFormat(manualAddress.postcode)) {
      setSearchError('Invalid postcode format');
      return;
    }

    // Normalize postcode
    const normalizedAddress = {
      ...manualAddress,
      postcode: postcodeAPI.normalize(manualAddress.postcode)
    };

    onChange(normalizedAddress);
    setManualAddress(normalizedAddress);
    setMode('display');
    setSearchError(null);
  };

  const handleEdit = () => {
    setMode('manual');
    setSearchError(null);
  };

  const handleSwitchToManual = () => {
    setMode('manual');
    setSearchError(null);
    setShowSuggestions(false);
  };

  const handleSwitchToSearch = () => {
    setMode('search');
    setSearchError(null);
    setSearchQuery('');
  };

  const formatAddressDisplay = (addr: Address): string => {
    const parts = [
      addr.street,
      addr.city,
      addr.county,
      addr.postcode,
      addr.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Search Mode
  if (mode === 'search') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter postcode or street (e.g., SW1A 1AA or 10 Downing Street)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(null);
                }}
                disabled={disabled || isLoadingAddress}
                className="pl-10"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Loading indicator */}
          {isLoadingAddress && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading address details...</p>
            </div>
          )}

          {/* Autocomplete suggestions with full addresses */}
          {showSuggestions && suggestions.length > 0 && !isLoadingAddress && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoadingAddress}
                >
                  <MapPin className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {suggestion.address}
                </button>
              ))}
            </div>
          )}
        </div>

        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Start typing your postcode or street address to see suggestions
        </p>

        {showManualEntry && (
          <button
            type="button"
            onClick={handleSwitchToManual}
            disabled={disabled}
            className="text-sm text-primary hover:underline"
          >
            Enter address manually
          </button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Manual Entry Mode
  if (mode === 'manual') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-2">
          <Label htmlFor={`${name}-street`}>
            Street Address {required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`${name}-street`}
            type="text"
            value={manualAddress.street}
            onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
            disabled={disabled}
            placeholder="Enter house number and street (e.g., 10 Downing Street)"
          />
          <p className="text-xs text-muted-foreground">
            Include your house/building number and street name
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${name}-city`}>City</Label>
            <Input
              id={`${name}-city`}
              type="text"
              value={manualAddress.city}
              onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
              disabled={disabled}
              placeholder="London"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${name}-county`}>County</Label>
            <Input
              id={`${name}-county`}
              type="text"
              value={manualAddress.county}
              onChange={(e) => setManualAddress({ ...manualAddress, county: e.target.value })}
              disabled={disabled}
              placeholder="Greater London"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${name}-postcode`}>
              Postcode {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={`${name}-postcode`}
              type="text"
              value={manualAddress.postcode}
              onChange={(e) => setManualAddress({ ...manualAddress, postcode: e.target.value.toUpperCase() })}
              disabled={disabled}
              placeholder="SW1A 1AA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${name}-country`}>
              Country {required && <span className="text-destructive">*</span>}
            </Label>
            <select
              id={`${name}-country`}
              value={manualAddress.country}
              onChange={(e) => setManualAddress({ ...manualAddress, country: e.target.value })}
              disabled={disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {UK_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleManualSubmit}
            disabled={disabled}
          >
            Save Address
          </Button>
          {!defaultToManual && (
            <button
              type="button"
              onClick={handleSwitchToSearch}
              disabled={disabled}
              className="text-sm text-primary hover:underline"
            >
              Search by postcode instead
            </button>
          )}
        </div>
      </div>
    );
  }

  // Display Mode
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start justify-between p-4 border rounded-md bg-muted/50">
        <div className="flex-1">
          <MapPin className="inline h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{formatAddressDisplay(value!)}</span>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
