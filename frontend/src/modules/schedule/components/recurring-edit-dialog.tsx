import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarCheck, CalendarRange } from "lucide-react";
import { format } from "date-fns";

export type EditScope = "this" | "all" | "future";

interface RecurringEditDialogProps {
  open: boolean;
  onClose: () => void;
  onEditScope: (scope: EditScope) => void;
  eventTitle: string;
  occurrenceDate: string;
  eventType: "training" | "match";
}

export function RecurringEditDialog({
  open,
  onClose,
  onEditScope,
  eventTitle,
  occurrenceDate,
  eventType
}: RecurringEditDialogProps) {
  const [scope, setScope] = useState<EditScope>("this");

  const handleConfirm = () => {
    onEditScope(scope);
    onClose();
  };

  const formattedDate = format(new Date(occurrenceDate), "MMMM d, yyyy");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Recurring {eventType === "training" ? "Session" : "Match"}</DialogTitle>
          <DialogDescription>
            "{eventTitle}" is a recurring event. Choose which occurrences to edit.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={scope} onValueChange={(v) => setScope(v as EditScope)}>
            <div className="space-y-3">
              {/* Edit This Occurrence Only */}
              <div
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  scope === "this"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setScope("this")}
              >
                <RadioGroupItem value="this" id="this" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="this"
                    className="font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Only this event
                  </Label>
                  <p className="text-sm text-gray-600">
                    Changes will only apply to {formattedDate}. Other occurrences remain unchanged.
                  </p>
                </div>
              </div>

              {/* Edit This and Future Occurrences */}
              <div
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  scope === "future"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setScope("future")}
              >
                <RadioGroupItem value="future" id="future" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="future"
                    className="font-medium cursor-pointer flex items-center gap-2"
                  >
                    <CalendarRange className="h-4 w-4" />
                    This and future events
                  </Label>
                  <p className="text-sm text-gray-600">
                    Changes will apply from {formattedDate} onwards. Past occurrences remain unchanged.
                  </p>
                </div>
              </div>

              {/* Edit All Occurrences */}
              <div
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  scope === "all"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setScope("all")}
              >
                <RadioGroupItem value="all" id="all" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="all"
                    className="font-medium cursor-pointer flex items-center gap-2"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    All events
                  </Label>
                  <p className="text-sm text-gray-600">
                    Changes will apply to all occurrences in this recurring series, including past and future events.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
