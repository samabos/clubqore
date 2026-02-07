import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Season, CreateSeasonRequest } from "@/types/season";
import { formatDateForInput } from "@/utils/dateUtils";

interface SeasonFormProps {
  season?: Season | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSeasonRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export function SeasonForm({
  season,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SeasonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSeasonRequest>({
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
    },
  });

  // Reset form when season data changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      reset(
        season
          ? {
              name: season.name,
              start_date: formatDateForInput(season.start_date),
              end_date: formatDateForInput(season.end_date),
            }
          : {
              name: "",
              start_date: "",
              end_date: "",
            }
      );
    }
  }, [season, isOpen, reset]);

  const handleFormSubmit = async (data: CreateSeasonRequest) => {
    try {
      await onSubmit(data);
      reset();
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {season ? "Edit Season" : "Create New Season"}
          </DialogTitle>
          <DialogDescription>
            {season
              ? "Update the season details below."
              : "Create a new season to organize training sessions and matches."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4">
            {/* Season Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Season Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., 2024/2025 Season"
                {...register("name", {
                  required: "Season name is required",
                  minLength: {
                    value: 3,
                    message: "Season name must be at least 3 characters",
                  },
                })}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", {
                  required: "Start date is required",
                })}
                disabled={isSubmitting}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date", {
                  required: "End date is required",
                  validate: (value, formValues) => {
                    if (
                      formValues.start_date &&
                      new Date(value) <= new Date(formValues.start_date)
                    ) {
                      return "End date must be after start date";
                    }
                    return true;
                  },
                })}
                disabled={isSubmitting}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {season ? "Updating..." : "Creating..."}
                </>
              ) : season ? (
                "Update Season"
              ) : (
                "Create Season"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
