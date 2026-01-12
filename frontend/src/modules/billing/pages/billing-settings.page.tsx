import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BillingSettingsForm, ScheduledJobsList } from "../components";
import {
  fetchBillingSettings,
  updateBillingSettings,
  fetchScheduledJobs,
} from "../actions/billing-actions";
import type { BillingSettings, UpdateBillingSettingsRequest, ScheduledInvoiceJob } from "@/types/billing";

export function BillingSettingsPage() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [jobs, setJobs] = useState<ScheduledInvoiceJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, jobsData] = await Promise.all([
        fetchBillingSettings(),
        fetchScheduledJobs(),
      ]);
      setSettings(settingsData);
      setJobs(jobsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load billing settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (data: UpdateBillingSettingsRequest) => {
    try {
      await updateBillingSettings(data);
      toast({
        title: "Success",
        description: "Billing settings updated successfully",
      });
      loadData(); // Reload to get fresh data including scheduled jobs
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure billing automation and service charges
        </p>
      </div>

      {/* Settings Form */}
      <BillingSettingsForm
        settings={settings}
        onSubmit={handleUpdateSettings}
        isLoading={isLoading}
      />

      {/* Scheduled Jobs */}
      {jobs.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Invoice Jobs</CardTitle>
              <CardDescription>
                View upcoming and past automated invoice generation jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledJobsList jobs={jobs} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
