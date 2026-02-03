/**
 * System Settings Page
 *
 * Platform-wide configuration management for super admins
 * Features:
 * - View all system configurations grouped by category
 * - Edit configuration values with validation
 * - View audit history for each configuration
 * - Clear configuration cache
 */

import { useState, useEffect } from 'react';
import { Loader2, Settings, History, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  getAllSystemConfigsAdmin,
  deleteSystemConfig,
  clearSystemConfigCache,
  type SystemConfig,
} from '@/api/systemConfig';
import { SystemConfigForm } from '../components/system-config-form';
import { ConfigAuditDialog } from '../components/config-audit-dialog';

export function SystemSettingsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [auditConfigId, setAuditConfigId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('registration');

  // Fetch all configurations
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllSystemConfigsAdmin({ activeOnly: true });
      setConfigs(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load system configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Group configs by category
  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  // Handle delete configuration
  const handleDelete = async (id: number, key: string) => {
    if (!confirm(`Are you sure you want to delete the configuration "${key}"?`)) {
      return;
    }

    try {
      await deleteSystemConfig(id);
      toast.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete configuration');
    }
  };

  // Handle clear cache
  const handleClearCache = async () => {
    try {
      await clearSystemConfigCache();
      toast.success('Configuration cache cleared successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cache');
    }
  };

  // Render configuration value based on type
  const renderValue = (config: SystemConfig) => {
    if (config.data_type === 'boolean') {
      return config.value ? (
        <Badge variant="default">Enabled</Badge>
      ) : (
        <Badge variant="secondary">Disabled</Badge>
      );
    }

    if (config.data_type === 'json') {
      return <code className="text-xs">{JSON.stringify(config.value)}</code>;
    }

    return <span className="font-medium">{config.value}</span>;
  };

  // Category display names
  const categoryLabels: Record<string, string> = {
    registration: 'Registration & Members',
    financial: 'Financial & Billing',
    system: 'System Behavior',
    notifications: 'Email & Notifications',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage global system configurations that apply to all clubs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearCache}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {(['registration', 'financial', 'system', 'notifications'] as const).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{categoryLabels[category]}</CardTitle>
                <CardDescription>
                  {configsByCategory[category]?.length || 0} configuration(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!configsByCategory[category] || configsByCategory[category].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No configurations in this category
                  </p>
                ) : (
                  <div className="space-y-4">
                    {configsByCategory[category].map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{config.key}</h3>
                            <Badge variant="outline" className="text-xs">
                              {config.data_type}
                            </Badge>
                          </div>
                          {config.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          )}
                          <div className="mt-2">{renderValue(config)}</div>
                          {config.validation_rules && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {config.validation_rules.min !== undefined && (
                                <span className="mr-3">Min: {config.validation_rules.min}</span>
                              )}
                              {config.validation_rules.max !== undefined && (
                                <span className="mr-3">Max: {config.validation_rules.max}</span>
                              )}
                              {config.validation_rules.allowed_values && (
                                <span>
                                  Allowed: {config.validation_rules.allowed_values.join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAuditConfigId(config.id)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingConfig(config)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config.id, config.key)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Config Dialog */}
      {editingConfig && (
        <SystemConfigForm
          config={editingConfig}
          onClose={() => setEditingConfig(null)}
          onSuccess={() => {
            setEditingConfig(null);
            fetchConfigs();
          }}
        />
      )}

      {/* Audit History Dialog */}
      {auditConfigId && (
        <ConfigAuditDialog
          configId={auditConfigId}
          onClose={() => setAuditConfigId(null)}
        />
      )}
    </div>
  );
}
