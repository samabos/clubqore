import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Building2 } from "lucide-react";
import { CreateClubRequest } from "@/types/membership";

interface ClubSetupProps {
  clubData: Partial<CreateClubRequest>;
  onClubDataUpdate: (clubData: Partial<CreateClubRequest>) => void;
}

interface ClubAddress {
  street: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

const UK_COUNTRIES = ['England', 'Scotland', 'Wales', 'Northern Ireland'] as const;

// Format address parts into a single string
function formatAddress(addr: ClubAddress): string {
  const parts = [
    addr.street,
    addr.city,
    addr.county,
    addr.postcode,
    addr.country
  ].filter(Boolean);
  return parts.join(', ');
}

// Parse a formatted address string back into parts
function parseAddress(addressStr: string | undefined): ClubAddress {
  if (!addressStr) {
    return { street: '', city: '', county: '', postcode: '', country: 'England' };
  }
  const parts = addressStr.split(', ').map(p => p.trim());
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    county: parts[2] || '',
    postcode: parts[3] || '',
    country: parts[4] || 'England'
  };
}

export function ClubSetup({ clubData, onClubDataUpdate }: ClubSetupProps) {
  const [address, setAddress] = useState<ClubAddress>(() => parseAddress(clubData.address));

  // Update parent when address fields change
  useEffect(() => {
    const formattedAddress = formatAddress(address);
    if (formattedAddress !== clubData.address) {
      onClubDataUpdate({ ...clubData, address: formattedAddress });
    }
  }, [address]);

  const updateAddressField = (field: keyof ClubAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Create Your Club
        </h2>
        <p className="text-gray-600">Set up your football club</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clubName">Club Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="clubName"
              value={clubData.name || ""}
              onChange={(e) => onClubDataUpdate({ ...clubData, name: e.target.value })}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Enter your club name"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Club Address</Label>

          <div className="space-y-2">
            <Label htmlFor="street" className="text-sm font-normal text-gray-600">Street Address</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => updateAddressField("street", e.target.value)}
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="10 Stadium Road"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-normal text-gray-600">City</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="London"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="county" className="text-sm font-normal text-gray-600">County</Label>
              <Input
                id="county"
                value={address.county}
                onChange={(e) => updateAddressField("county", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Greater London"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postcode" className="text-sm font-normal text-gray-600">Postcode</Label>
              <Input
                id="postcode"
                value={address.postcode}
                onChange={(e) => updateAddressField("postcode", e.target.value.toUpperCase())}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="SW1A 1AA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-normal text-gray-600">Country</Label>
              <select
                id="country"
                value={address.country}
                onChange={(e) => updateAddressField("country", e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary/20 focus:outline-none"
              >
                {UK_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
