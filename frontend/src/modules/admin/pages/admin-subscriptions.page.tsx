/**
 * Admin Subscriptions Page
 *
 * Super admin view of all subscriptions across all clubs.
 * Includes pagination, filtering by status/club/sync status, and search.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  fetchAdminSubscriptions,
  fetchAllClubs,
  type AdminSubscription,
  type AdminSubscriptionFilters
} from '../actions/billing-jobs-actions';

export function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [clubs, setClubs] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [syncFilter, setSyncFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch data
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);

      const filters: AdminSubscriptionFilters = {
        page,
        limit
      };

      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (clubFilter && clubFilter !== 'all') {
        filters.clubId = parseInt(clubFilter);
      }
      if (syncFilter === 'synced') {
        filters.hasProviderSubscription = true;
      } else if (syncFilter === 'not_synced') {
        filters.hasProviderSubscription = false;
      }
      if (fromDate) {
        filters.fromDate = fromDate;
      }
      if (toDate) {
        filters.toDate = toDate;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const result = await fetchAdminSubscriptions(filters);
      setSubscriptions(result.subscriptions);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);

      if (showToast) {
        toast.success('Data refreshed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load subscriptions';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, clubFilter, syncFilter, fromDate, toDate, searchTerm, limit]);

  // Fetch clubs on mount
  useEffect(() => {
    fetchAllClubs()
      .then(setClubs)
      .catch(() => toast.error('Failed to load clubs'));
  }, []);

  // Fetch subscriptions when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, clubFilter, syncFilter, fromDate, toDate, searchTerm]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="default" className="bg-amber-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get sync status badge
  const getSyncBadge = (sub: AdminSubscription) => {
    if (sub.providerSubscriptionId) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Synced
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-600">
        <Clock className="w-3 h-3 mr-1" />
        Not Synced
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Subscriptions</h1>
          <p className="text-base text-muted-foreground">
            View all subscriptions across all clubs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <Input
            placeholder="Search name, email, club..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64 h-10"
          />
          <Button type="submit" variant="outline" className="h-10 px-3 active:scale-95 transition-transform">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {/* Club Filter */}
        <Select value={clubFilter} onValueChange={setClubFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sync Status Filter */}
        <Select value={syncFilter} onValueChange={setSyncFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="GC Sync" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sync Status</SelectItem>
            <SelectItem value="synced">Synced to GC</SelectItem>
            <SelectItem value="not_synced">Not Synced</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-36"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-36"
          />
        </div>

        {/* Clear Filters */}
        {(statusFilter !== 'all' || clubFilter !== 'all' || syncFilter !== 'all' || fromDate || toDate || searchTerm) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStatusFilter('all');
              setClubFilter('all');
              setSyncFilter('all');
              setFromDate('');
              setToDate('');
              setSearchInput('');
              setSearchTerm('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>
              Showing {subscriptions.length} of {total}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>No subscriptions found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GoCardless</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono">{sub.id}</TableCell>
                      <TableCell>{sub.club?.name || '-'}</TableCell>
                      <TableCell>{sub.tier || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {sub.child?.name || 'No name'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sub.parent?.name || 'No name'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            £{parseFloat(sub.amount || '0').toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {sub.billingFrequency === 'annual' ? 'Yearly' : 'Monthly'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getSyncBadge(sub)}
                          {sub.providerSubscriptionId && (
                            <div className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                              {sub.providerSubscriptionId.substring(0, 12)}...
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(sub.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSubscriptionsPage;
