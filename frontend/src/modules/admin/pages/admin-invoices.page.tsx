/**
 * Admin Invoices Page
 *
 * Super admin view of all invoices across all clubs.
 * Includes pagination, filtering by status/club/date, and search.
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
  FileText,
  AlertTriangle
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
  fetchAdminInvoices,
  fetchAllClubs,
  type AdminInvoice,
  type AdminInvoiceFilters
} from '../actions/billing-jobs-actions';

export function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
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
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch data
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);

      const filters: AdminInvoiceFilters = {
        page,
        limit
      };

      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (clubFilter && clubFilter !== 'all') {
        filters.clubId = parseInt(clubFilter);
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

      const result = await fetchAdminInvoices(filters);
      setInvoices(result.invoices);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);

      if (showToast) {
        toast.success('Data refreshed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load invoices';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, clubFilter, fromDate, toDate, searchTerm, limit]);

  // Fetch clubs on mount
  useEffect(() => {
    fetchAllClubs()
      .then(setClubs)
      .catch(() => toast.error('Failed to load clubs'));
  }, []);

  // Fetch invoices when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, clubFilter, fromDate, toDate, searchTerm]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="default" className="bg-amber-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
          <h1 className="text-2xl font-bold">All Invoices</h1>
          <p className="text-base text-muted-foreground">
            View all invoices across all clubs
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
            placeholder="Search invoice #, name, email..."
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
        {(statusFilter !== 'all' || clubFilter !== 'all' || fromDate || toDate || searchTerm) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStatusFilter('all');
              setClubFilter('all');
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

      {/* Invoices Table */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Showing {invoices.length} of {total}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>No invoices found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.club?.name || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {invoice.child?.name || 'No name'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.parent?.name || 'No name'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                          {invoice.amountPaid > 0 && invoice.amountPaid < invoice.totalAmount && (
                            <div className="text-sm text-muted-foreground">
                              Paid: {formatCurrency(invoice.amountPaid)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.issueDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.dueDate)}
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

export default AdminInvoicesPage;
