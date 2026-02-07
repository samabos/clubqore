import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

export interface EventCardProps {
  event: {
    id: string;
    type: 'training' | 'match';
    title?: string;
    opponent?: string | null;
    is_home?: boolean;
    date: string;
    start_time: string;
    end_time?: string;
    location: string;
    team_name: string;
    child_first_name?: string | null;
    child_last_name?: string | null;
  };
  variant?: 'default' | 'compact';
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = parseISO(event.date);
  const dateLabel = isToday(eventDate)
    ? 'Today'
    : isTomorrow(eventDate)
    ? 'Tomorrow'
    : format(eventDate, 'MMM d');

  const getEventTitle = () => {
    if (event.type === 'training') {
      return event.title || 'Training Session';
    }

    // Match display
    if (event.is_home) {
      return `vs ${event.opponent || 'TBD'} (Home)`;
    } else {
      return `@ ${event.opponent || 'TBD'} (Away)`;
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="space-y-3">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            event.type === 'training'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'
          }`}>
            {event.type === 'training' ? (
              <Calendar className="w-4 h-4" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">
              {getEventTitle()}
            </h4>
            {event.child_first_name && (
              <p className="text-sm font-medium text-blue-600 mb-1">
                {event.child_first_name} {event.child_last_name}
              </p>
            )}
            <p className="text-xs text-gray-600">
              {event.team_name}
            </p>
          </div>
        </div>

        {/* Date badge and type badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={event.type === "match" ? "default" : "outline"}
            className="rounded-lg text-xs"
          >
            {dateLabel}
          </Badge>
          <Badge
            variant="secondary"
            className={`rounded-lg text-xs ${
              event.type === "match"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {event.type}
          </Badge>
        </div>

        {/* Time and location */}
        <div className="pt-2 border-t border-gray-200 space-y-1.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              {event.start_time}
              {event.type === 'training' && event.end_time && ` - ${event.end_time}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {event.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
