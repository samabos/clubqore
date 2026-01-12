import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertCircle } from "lucide-react";
import { ChildrenTable } from "../components/children-table";
import { fetchParentChildren } from "../actions";
import type { EnrichedChild } from "../types";

export function MyChildrenPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchParentChildren();
      setChildren(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load children');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = () => {
    navigate("/app/profile");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Children</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your children's information
            </p>
          </div>
          <Button onClick={handleAddChild}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={loadChildren}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ChildrenTable children={children} isLoading={isLoading} />
    </div>
  );
}
