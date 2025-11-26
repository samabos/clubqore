import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Dumbbell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  publishTrainingSession,
} from "../actions/training-session-actions";
import { fetchSeasons } from "@/modules/season/actions/season-actions";
import { fetchTeams } from "@/modules/team/actions";
import type {
  TrainingSession,
  CreateTrainingSessionRequest,
} from "@/types/training-session";
import type { Season } from "@/types/season";
import type { Team } from "@/types/team";
import { TrainingSessionForm, TrainingSessionCard } from "../components";

export function TrainingSessionManagementPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sessionsData, seasonsData, teamsData] = await Promise.all([
        fetchTrainingSessions(),
        fetchSeasons(),
        fetchTeams(),
      ]);
      setSessions(sessionsData);
      setSeasons(seasonsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load training sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (data: CreateTrainingSessionRequest) => {
    try {
      setIsSubmitting(true);
      await createTrainingSession(data);
      toast.success("Training session created successfully!");
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create training session");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSession = async (data: CreateTrainingSessionRequest) => {
    if (!editingSession) return;

    try {
      setIsSubmitting(true);
      await updateTrainingSession(editingSession.id, data);
      toast.success("Training session updated successfully!");
      setIsFormOpen(false);
      setEditingSession(null);
      await loadData();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update training session");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (session: TrainingSession) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${session.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteTrainingSession(session.id);
        toast.success("Training session deleted successfully!");
        await loadData();
      } catch (error) {
        console.error("Error deleting session:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete training session";
        toast.error(message);
      }
    }
  };

  const handlePublishSession = async (session: TrainingSession) => {
    try {
      await publishTrainingSession(session.id);
      toast.success(`${session.title} has been published`);
      await loadData();
    } catch (error) {
      console.error("Error publishing session:", error);
      toast.error("Failed to publish training session");
    }
  };

  const handleEditSession = (session: TrainingSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSession(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Training Sessions
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage training sessions for your teams
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Session
        </Button>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Dumbbell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No training sessions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by scheduling your first training session
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <TrainingSessionCard
              key={session.id}
              session={session}
              onEdit={handleEditSession}
              onDelete={handleDeleteSession}
              onPublish={handlePublishSession}
            />
          ))}
        </div>
      )}

      {/* Session Form Dialog */}
      <TrainingSessionForm
        session={editingSession}
        seasons={seasons}
        teams={teams}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={
          editingSession ? handleUpdateSession : handleCreateSession
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
