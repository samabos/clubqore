import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import {
  InvoiceFilters,
  InvoiceStatus,
  InvoiceType,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from "@/types/billing";
import { Season } from "@/types/season";

interface BillingFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  seasons?: Season[];
  showSeasonFilter?: boolean;
  showUserFilter?: boolean;
}

export function BillingFilters({
  filters,
  onFiltersChange,
  seasons = [],
  showSeasonFilter = true,
}: BillingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof InvoiceFilters, value: InvoiceFilters[keyof InvoiceFilters]) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status Filter */}
        <div className="w-48">
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              handleFilterChange("status", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {INVOICE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="w-48">
          <Select
            value={filters.invoice_type || "all"}
            onValueChange={(value) =>
              handleFilterChange("invoice_type", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {INVOICE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Season Filter */}
        {showSeasonFilter && seasons.length > 0 && (
          <div className="w-48">
            <Select
              value={filters.season_id?.toString() || "all"}
              onValueChange={(value) =>
                handleFilterChange("season_id", value === "all" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by invoice number or member name"
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={isExpanded ? "bg-accent" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="flex items-center gap-4 flex-wrap p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From:</label>
            <Input
              type="date"
              value={filters.from_date || ""}
              onChange={(e) => handleFilterChange("from_date", e.target.value)}
              className="w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To:</label>
            <Input
              type="date"
              value={filters.to_date || ""}
              onChange={(e) => handleFilterChange("to_date", e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      )}
    </div>
  );
}
