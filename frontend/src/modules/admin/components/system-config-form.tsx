/**
 * System Config Form
 *
 * Dialog form for editing system configuration values
 * Handles different data types with appropriate input controls
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updateSystemConfig, type SystemConfig } from '@/api/systemConfig';

interface SystemConfigFormProps {
  config: SystemConfig;
  onClose: () => void;
  onSuccess: () => void;
}

export function SystemConfigForm({ config, onClose, onSuccess }: SystemConfigFormProps) {
  const [value, setValue] = useState<any>(config.value);
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate value based on data type and validation rules
    if (config.data_type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        toast.error('Value must be a valid number');
        return;
      }

      if (config.validation_rules?.min !== undefined && numValue < config.validation_rules.min) {
        toast.error(`Value must be at least ${config.validation_rules.min}`);
        return;
      }

      if (config.validation_rules?.max !== undefined && numValue > config.validation_rules.max) {
        toast.error(`Value must be at most ${config.validation_rules.max}`);
        return;
      }
    }

    if (config.data_type === 'string') {
      if (
        config.validation_rules?.minLength !== undefined &&
        value.length < config.validation_rules.minLength
      ) {
        toast.error(`Value must be at least ${config.validation_rules.minLength} characters`);
        return;
      }

      if (
        config.validation_rules?.maxLength !== undefined &&
        value.length > config.validation_rules.maxLength
      ) {
        toast.error(`Value must be at most ${config.validation_rules.maxLength} characters`);
        return;
      }
    }

    if (config.data_type === 'enum') {
      if (
        config.validation_rules?.allowed_values &&
        !config.validation_rules.allowed_values.includes(value)
      ) {
        toast.error('Value must be one of the allowed options');
        return;
      }
    }

    try {
      setLoading(true);

      // Convert value to appropriate type
      let finalValue = value;
      if (config.data_type === 'number') {
        finalValue = Number(value);
      }

      await updateSystemConfig(config.id, {
        value: finalValue,
        change_reason: changeReason || undefined,
      });

      toast.success('Configuration updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  // Render appropriate input based on data type
  const renderInput = () => {
    switch (config.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id="value"
              checked={value}
              onCheckedChange={setValue}
            />
            <Label htmlFor="value">{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );

      case 'enum':
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {config.validation_rules?.allowed_values?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={config.validation_rules?.min}
            max={config.validation_rules?.max}
            required
          />
        );

      case 'json':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                // Allow editing even if JSON is temporarily invalid
                setValue(e.target.value);
              }
            }}
            rows={6}
            className="font-mono text-sm"
            required
          />
        );

      case 'string':
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            minLength={config.validation_rules?.minLength}
            maxLength={config.validation_rules?.maxLength}
            required
          />
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>{config.key}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Description */}
            {config.description && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                {config.description}
              </div>
            )}

            {/* Value Input */}
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {renderInput()}
              {config.validation_rules && (
                <p className="text-xs text-muted-foreground">
                  {config.validation_rules.min !== undefined && (
                    <span className="mr-3">Min: {config.validation_rules.min}</span>
                  )}
                  {config.validation_rules.max !== undefined && (
                    <span className="mr-3">Max: {config.validation_rules.max}</span>
                  )}
                  {config.validation_rules.minLength !== undefined && (
                    <span className="mr-3">Min Length: {config.validation_rules.minLength}</span>
                  )}
                  {config.validation_rules.maxLength !== undefined && (
                    <span className="mr-3">Max Length: {config.validation_rules.maxLength}</span>
                  )}
                </p>
              )}
            </div>

            {/* Change Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Change Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Why are you changing this value?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
