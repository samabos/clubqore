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
import type { Match, CreateMatchRequest, MatchType } from "@/types/match";
import type { Season } from "@/types/season";
import type { Team } from "@/types/team";
import { formatDateForInput } from "@/utils/dateUtils";

interface MatchFormProps {
  match?: Match | null;
  seasons: Season[];
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMatchRequest) => Promise<void>;
  isSubmitting?: boolean;
}

const matchTypes: { value: MatchType; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "league", label: "League" },
  { value: "cup", label: "Cup" },
  { value: "tournament", label: "Tournament" },
  { value: "scrimmage", label: "Scrimmage" },
];

export function MatchForm({
  match,
  seasons,
  teams,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: MatchFormProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>("");
  const [selectedMatchType, setSelectedMatchType] = useState<MatchType>("friendly");
  const [opponentType, setOpponentType] = useState<"internal" | "external">("external");
  const [isHomeMatch, setIsHomeMatch] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateMatchRequest>({
    defaultValues: {
      venue: "",
      date: "",
      start_time: "",
      end_time: "",
      competition_name: "",
    },
  });

  // Reset form when match data changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (match) {
        // Editing existing match
        reset({
          season_id: match.season_id,
          match_type: match.match_type,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          opponent_name: match.opponent_name,
          is_home: match.is_home,
          venue: match.venue,
          date: formatDateForInput(match.date),
          start_time: match.start_time?.substring(0, 5) || "",
          end_time: match.end_time?.substring(0, 5) || "",
          competition_name: match.competition_name || "",
        });
        setSelectedSeason(match.season_id?.toString() || "");
        setSelectedHomeTeam(match.home_team_id?.toString() || "");
        setSelectedAwayTeam(match.away_team_id?.toString() || "");
        setSelectedMatchType(match.match_type);
        setOpponentType(match.away_team_id ? "internal" : "external");
        setIsHomeMatch(match.is_home);
      } else {
        // Creating new match
        reset({
          venue: "",
          date: "",
          start_time: "",
          end_time: "",
          competition_name: "",
          match_type: "friendly",
        });
        setSelectedSeason("");
        setSelectedHomeTeam("");
        setSelectedAwayTeam("");
        setSelectedMatchType("friendly");
        setOpponentType("external");
        setIsHomeMatch(true);
      }
    }
  }, [match, isOpen, reset]);

  const handleFormSubmit = async (data: CreateMatchRequest) => {
    try {
      const payload: CreateMatchRequest = {
        ...data,
        season_id: selectedSeason ? parseInt(selectedSeason) : null,
        home_team_id: parseInt(selectedHomeTeam),
        match_type: selectedMatchType,
        is_home: isHomeMatch,
      };

      // Handle opponent based on type
      if (opponentType === "internal") {
        payload.away_team_id = parseInt(selectedAwayTeam);
        payload.opponent_name = null;
      } else {
        payload.away_team_id = null;
        payload.opponent_name = data.opponent_name;
      }

      await onSubmit(payload);
      reset();
      setSelectedSeason("");
      setSelectedHomeTeam("");
      setSelectedAwayTeam("");
      setOpponentType("external");
      setIsHomeMatch(true);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    reset();
    setSelectedSeason("");
    setSelectedHomeTeam("");
    setSelectedAwayTeam("");
    setOpponentType("external");
    setIsHomeMatch(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{match ? "Edit Match" : "Create Match"}</DialogTitle>
          <DialogDescription>
            {match
              ? "Update the match details below."
              : "Schedule a new match for your team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4">
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

            {/* Home Team */}
            <div className="space-y-2">
              <Label htmlFor="home_team">
                Home Team <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedHomeTeam}
                onValueChange={setSelectedHomeTeam}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedHomeTeam && (
                <p className="text-sm text-red-500">Home team is required</p>
              )}
            </div>

            {/* Match Type */}
            <div className="space-y-2">
              <Label htmlFor="match_type">Match Type</Label>
              <Select
                value={selectedMatchType}
                onValueChange={(value) => setSelectedMatchType(value as MatchType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matchTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opponent Type */}
            <div className="space-y-3 border-t pt-4">
              <Label>Opponent Type</Label>
              <RadioGroup
                value={opponentType}
                onValueChange={(value) => setOpponentType(value as "internal" | "external")}
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="internal" id="internal" />
                  <Label htmlFor="internal" className="font-normal cursor-pointer">
                    Internal Scrimmage (vs another club team)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id="external" />
                  <Label htmlFor="external" className="font-normal cursor-pointer">
                    External Opponent
                  </Label>
                </div>
              </RadioGroup>

              {/* Conditional opponent fields */}
              {opponentType === "internal" ? (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="away_team">
                    Away Team <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedAwayTeam}
                    onValueChange={setSelectedAwayTeam}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter((team) => team.id.toString() !== selectedHomeTeam)
                        .map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {opponentType === "internal" && !selectedAwayTeam && (
                    <p className="text-sm text-red-500">Away team is required</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="opponent_name">
                      Opponent Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="opponent_name"
                      placeholder="e.g., City United FC"
                      {...register("opponent_name", {
                        required: opponentType === "external" ? "Opponent name is required" : false,
                      })}
                      disabled={isSubmitting}
                    />
                    {errors.opponent_name && (
                      <p className="text-sm text-red-500">
                        {errors.opponent_name.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_home"
                      checked={isHomeMatch}
                      onCheckedChange={(checked) => setIsHomeMatch(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor="is_home"
                      className="font-normal cursor-pointer"
                    >
                      This is a home match
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
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
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register("end_time")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">
                Venue <span className="text-red-500">*</span>
              </Label>
              <Input
                id="venue"
                placeholder="e.g., Main Stadium"
                {...register("venue", {
                  required: "Venue is required",
                })}
                disabled={isSubmitting}
              />
              {errors.venue && (
                <p className="text-sm text-red-500">{errors.venue.message}</p>
              )}
            </div>

            {/* Competition Name */}
            <div className="space-y-2">
              <Label htmlFor="competition_name">Competition Name</Label>
              <Input
                id="competition_name"
                placeholder="e.g., Premier League, FA Cup"
                {...register("competition_name")}
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
                !selectedHomeTeam ||
                (opponentType === "internal" && !selectedAwayTeam)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {match ? "Updating..." : "Creating..."}
                </>
              ) : match ? (
                "Update Match"
              ) : (
                "Create Match"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
