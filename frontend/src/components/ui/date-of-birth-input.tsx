/**
 * Date of Birth Input Component
 *
 * A user-friendly date input with separate Day, Month, Year dropdowns
 * Validates against global min/max age settings from system configuration
 */

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getAllSystemConfigs } from '@/api/systemConfig';

interface DateOfBirthInputProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  onError?: (error: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
}

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function DateOfBirthInput({
  value,
  onChange,
  onError,
  disabled = false,
  required = false,
  className = '',
  label = 'Date of Birth',
}: DateOfBirthInputProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [minAge, setMinAge] = useState(5);
  const [maxAge, setMaxAge] = useState(18);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setYear(y);
        setMonth(String(parseInt(m, 10)));
        setDay(String(parseInt(d, 10)));
      }
    }
  }, [value]);

  // Fetch global age settings
  useEffect(() => {
    const fetchAgeSettings = async () => {
      try {
        const configs = await getAllSystemConfigs({ category: 'registration', activeOnly: true });
        const minAgeConfig = configs.find(c => c.key === 'min_member_age');
        const maxAgeConfig = configs.find(c => c.key === 'max_member_age');

        if (minAgeConfig) {
          const minValue = typeof minAgeConfig.value === 'string' ? parseInt(minAgeConfig.value, 10) : minAgeConfig.value;
          setMinAge(minValue);
        }
        if (maxAgeConfig) {
          const maxValue = typeof maxAgeConfig.value === 'string' ? parseInt(maxAgeConfig.value, 10) : maxAgeConfig.value;
          setMaxAge(maxValue);
        }
      } catch (err) {
        console.error('Failed to fetch age settings, using defaults:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgeSettings();
  }, []);

  // Calculate allowed year range
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - maxAge;
  const maxYear = currentYear - minAge;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  // Validate age
  const validateAge = (dateString: string): string | null => {
    if (!dateString) return null;

    const dob = new Date(dateString);
    const today = new Date();

    // Calculate age more accurately
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    if (age < minAge) {
      return `Member must be at least ${minAge} years old`;
    }
    if (age > maxAge) {
      return `Member must be ${maxAge} years old or younger`;
    }
    return null;
  };

  // Handle value changes
  const handleChange = (newDay: string, newMonth: string, newYear: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      const dateString = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      const validationError = validateAge(dateString);
      setError(validationError);
      onError?.(validationError);

      if (!validationError) {
        onChange(dateString);
      }
    }
  };

  // Get days in month
  const getDaysInMonth = () => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);

    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  if (loading) {
    return (
      <div className={className}>
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        <div className="text-sm text-muted-foreground mt-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {/* Day */}
        <Select
          value={day}
          onValueChange={(val) => handleChange(val, month, year)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {getDaysInMonth().map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month */}
        <Select
          value={month}
          onValueChange={(val) => handleChange(day, val, year)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select
          value={year}
          onValueChange={(val) => handleChange(day, month, val)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {/* Helper text */}
      {!error && (
        <p className="text-xs text-muted-foreground mt-1">
          Age must be between {minAge} and {maxAge} years old
        </p>
      )}
    </div>
  );
}
