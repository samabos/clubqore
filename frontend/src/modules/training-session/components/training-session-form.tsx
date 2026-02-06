import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type {
  TrainingSession,
  CreateTrainingSessionRequest,
  SessionType,
  RecurrencePattern,
} from "@/types/training-session";
import type { Season } from "@/types/season";
import type { Team } from "@/types/team";
import { formatDateForInput } from "@/utils/dateUtils";
import { MultiSelect } from "@/components/ui/multi-select";

interface TrainingSessionFormProps {
  session?: TrainingSession | null;
  seasons: Season[];
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTrainingSessionRequest) => Promise<void>;
  isSubmitting?: boolean;
}

const sessionTypes: { value: SessionType; label: string }[] = [
  { value: "training", label: "Training" },
  { value: "practice", label: "Practice" },
  { value: "conditioning", label: "Conditioning" },
  { value: "tactical", label: "Tactical" },
  { value: "friendly", label: "Friendly" },
  { value: "other", label: "Other" },
];

export function TrainingSessionForm({
  session,
  seasons,
  teams,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: TrainingSessionFormProps) {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<SessionType>("training");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTrainingSessionRequest>({
    defaultValues: {
      title: "",
      description: "",
      session_type: "training",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      max_participants: undefined,
    },
  });

  // Reset form when session data changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (session) {
        reset({
          season_id: session.season_id,
          title: session.title,
          description: session.description || "",
          session_type: session.session_type,
          date: formatDateForInput(session.date),
          start_time: session.start_time?.substring(0, 5) || "", // Strip seconds if present
          end_time: session.end_time?.substring(0, 5) || "", // Strip seconds if present
          location: session.location || "",
          coach_id: session.coach_id,
          max_participants: session.max_participants || undefined,
        });
        setSelectedType(session.session_type);
        setSelectedSeason(session.season_id?.toString() || "");
        setSelectedTeams(session.teams?.map((t) => t.id) || []);
        setIsRecurring(session.is_recurring || false);
        setRecurrencePattern(session.recurrence_pattern || "weekly");
        setRecurrenceDays(session.recurrence_days || []);
        setRecurrenceEndDate(session.recurrence_end_date ? formatDateForInput(session.recurrence_end_date) : "");
      } else {
        reset({
          title: "",
          description: "",
          session_type: "training",
          date: "",
          start_time: "",
          end_time: "",
          location: "",
          max_participants: undefined,
        });
        setSelectedType("training");
        setSelectedSeason("");
        setSelectedTeams([]);
        setIsRecurring(false);
        setRecurrencePattern("weekly");
        setRecurrenceDays([]);
        setRecurrenceEndDate("");
      }
    }
  }, [session, isOpen, reset]);

  const handleFormSubmit = async (data: CreateTrainingSessionRequest) => {
    try {
      const payload = {
        ...data,
        session_type: selectedType,
        season_id: selectedSeason ? parseInt(selectedSeason) : null,
        team_ids: selectedTeams,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_days: isRecurring && (recurrencePattern === "weekly" || recurrencePattern === "biweekly") ? recurrenceDays : null,
        recurrence_end_date: isRecurring ? recurrenceEndDate : null,
      };

      await onSubmit(payload);
      reset();
      setSelectedTeams([]);
      setIsRecurring(false);
      setRecurrenceDays([]);
      setRecurrenceEndDate("");
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTeams([]);
    setIsRecurring(false);
    setRecurrenceDays([]);
    setRecurrenceEndDate("");
    onClose();
  };

  const teamOptions = teams.map((team) => ({
    value: team.id.toString(),
    label: team.name,
  }));

  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const handleDayToggle = (day: number) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter((d) => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day].sort());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session ? "Edit Training Session" : "Create Training Session"}
          </DialogTitle>
          <DialogDescription>
            {session
              ? "Update the training session details below."
              : "Schedule a new training session for your teams."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., U12 Skills Training"
                {...register("title", {
                  required: "Title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters",
                  },
                })}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Season */}
            <div className="space-y-2">
              <Label htmlFor="season">Season (Optional)</Label>
              <Select
                value={selectedSeason || "none"}
                onValueChange={(value) =>
                  setSelectedSeason(value === "none" ? "" : value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Season</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teams */}
            <div className="space-y-2">
              <Label>
                Teams <span className="text-red-500">*</span>
              </Label>
              <MultiSelect
                options={teamOptions}
                selected={selectedTeams.map(String)}
                onChange={(values) => setSelectedTeams(values.map(Number))}
                placeholder="Select teams"
                disabled={isSubmitting}
              />
              {selectedTeams.length === 0 && (
                <p className="text-sm text-red-500">
                  At least one team is required
                </p>
              )}
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="session_type">Session Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as SessionType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                {isRecurring ? "Start Date" : "Date"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register("date", {
                  required: "Date is required",
                })}
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            {/* Recurring Options */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Session Frequency</Label>
                <RadioGroup
                  value={isRecurring ? "recurring" : "one-time"}
                  onValueChange={(value) => setIsRecurring(value === "recurring")}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one-time" id="one-time" />
                    <Label htmlFor="one-time" className="font-normal cursor-pointer">
                      One-time session
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recurring" id="recurring" />
                    <Label htmlFor="recurring" className="font-normal cursor-pointer">
                      Recurring session
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isRecurring && (
                <div className="space-y-4 pl-6 border-l-2">
                  {/* Recurrence Pattern */}
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_pattern">
                      Repeat Pattern <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={recurrencePattern}
                      onValueChange={(value) => setRecurrencePattern(value as RecurrencePattern)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly (Every 2 weeks)</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weekday Selection for Weekly/Biweekly */}
                  {(recurrencePattern === "weekly" || recurrencePattern === "biweekly") && (
                    <div className="space-y-2">
                      <Label>
                        Repeat on <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {weekDays.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={recurrenceDays.includes(day.value)}
                              onCheckedChange={() => handleDayToggle(day.value)}
                              disabled={isSubmitting}
                            />
                            <Label
                              htmlFor={`day-${day.value}`}
                              className="font-normal cursor-pointer"
                            >
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {recurrenceDays.length === 0 && (
                        <p className="text-sm text-red-500">
                          Select at least one day
                        </p>
                      )}
                    </div>
                  )}

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_end_date">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recurrence_end_date"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                    {isRecurring && !recurrenceEndDate && (
                      <p className="text-sm text-red-500">
                        End date is required for recurring sessions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register("start_time", {
                    required: "Start time is required",
                  })}
                  disabled={isSubmitting}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-500">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register("end_time", {
                    required: "End time is required",
                  })}
                  disabled={isSubmitting}
                />
                {errors.end_time && (
                  <p className="text-sm text-red-500">
                    {errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Training Ground"
                {...register("location")}
                disabled={isSubmitting}
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                placeholder="e.g., 20"
                {...register("max_participants", {
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Must be at least 1",
                  },
                })}
                disabled={isSubmitting}
              />
              {errors.max_participants && (
                <p className="text-sm text-red-500">
                  {errors.max_participants.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Session goals, drills, focus areas..."
                rows={3}
                {...register("description")}
                disabled={isSubmitting}
              />
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                selectedTeams.length === 0 ||
                (isRecurring && !recurrenceEndDate) ||
                (isRecurring &&
                  (recurrencePattern === "weekly" || recurrencePattern === "biweekly") &&
                  recurrenceDays.length === 0)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {session ? "Updating..." : "Creating..."}
                </>
              ) : session ? (
                "Update Session"
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
