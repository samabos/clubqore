import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BillingSettingsForm } from "../components";
import {
  fetchAllClubs,
  adminFetchBillingSettings,
  adminUpdateBillingSettings,
} from "../actions/admin-billing-actions";
import type { BillingSettings, UpdateBillingSettingsRequest } from "@/types/billing";
import type { Club } from "../actions/admin-billing-actions";

export function AdminBillingSettingsPage() {
  const { toast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      loadSettings(parseInt(selectedClubId));
    } else {
      setSettings(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClubId]);

  const loadClubs = async () => {
    try {
      setIsLoadingClubs(true);
      const clubsData = await fetchAllClubs();
      setClubs(clubsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load clubs";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingClubs(false);
    }
  };

  const loadSettings = async (clubId: number) => {
    try {
      setIsLoadingSettings(true);
      const settingsData = await adminFetchBillingSettings(clubId);
      setSettings(settingsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load billing settings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setSettings(null);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleUpdateSettings = async (data: UpdateBillingSettingsRequest) => {
    if (!selectedClubId) return;

    try {
      await adminUpdateBillingSettings(parseInt(selectedClubId), data);
      toast({
        title: "Success",
        description: "Billing settings updated successfully",
      });
      // Reload settings to get fresh data
      await loadSettings(parseInt(selectedClubId));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update settings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      // Don't re-throw - let the form handle completion
    }
  };

  if (isLoadingClubs) {
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
        <h1 className="text-3xl font-bold">Club Billing Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure billing automation and service charges for any club
        </p>
      </div>

      {/* Club Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Club</CardTitle>
          <CardDescription>
            Choose a club to view and edit its billing settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClubId} onValueChange={setSelectedClubId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a club..." />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id.toString()}>
                  {club.name} {club.verified ? "✓" : "(Unverified)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Settings Form */}
      {selectedClubId && (
        <>
          {isLoadingSettings ? (
            <div className="animate-pulse space-y-4">
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          ) : settings ? (
            <BillingSettingsForm
              settings={settings}
              onSubmit={handleUpdateSettings}
              isLoading={isLoadingSettings}
              isSuperAdmin={true}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No billing settings found for this club
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClubId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a club to view and edit its billing settings
          </CardContent>
        </Card>
      )}
    </div>
  );
}
