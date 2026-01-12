import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { AddressInput } from "../../../components/ui/address-input";
import { ContactLocationFormProps } from "../types/component-types";
import { normalizeAddress } from "../../../types/common";

export function ContactLocationForm({
  clubData,
  updateField,
}: ContactLocationFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
        Contact & Location
      </h3>

      <div className="space-y-2">
        <Label
          htmlFor="clubAddress"
          className="text-sm font-medium text-gray-700"
        >
          Club Address
        </Label>
        <AddressInput
          value={normalizeAddress(clubData.address)}
          onChange={(address) => updateField("address", address)}
          required={false}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="clubPhone"
          className="text-sm font-medium text-gray-700"
        >
          Club Phone Number
        </Label>
        <Input
          id="clubPhone"
          type="tel"
          value={clubData.phone || ""}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
