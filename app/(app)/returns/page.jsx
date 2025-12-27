"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { toast } from "../../../hooks/use-toast";
import { 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  ArrowRight,
  Undo2,
  TrendingDown,
  Package,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [outletFilter, setOutletFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadOutlets();
    fetchReturns();
    fetchStats();
  }, [page, outletFilter]);

  const loadOutlets = async () => {
    try {
      const response = await fetch('/api/outlets?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setOutlets(data.outlets || []);
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (outletFilter) {
        params.set('outlet_id', outletFilter);
      }
      
      const response = await fetch(`/api/returns?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setReturns(data.returns || []);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch returns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ stats: 'true', days: '30' });
      if (outletFilter) {
        params.set('outlet_id', outletFilter);
      }
      
      const response = await fetch(`/api/returns?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const filteredReturns = returns.filter((ret) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ret.product_name?.toLowerCase().includes(searchLower) ||
      ret.customer_name?.toLowerCase().includes(searchLower) ||
      ret.return_reason?.toLowerCase().includes(searchLower) ||
      ret.sale_id?.toString().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Returns Management</h1>
          <p className="text-muted-foreground">View and manage product returns</p>
        </div>
        <Button onClick={fetchReturns} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <Undo2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_returns || 0}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Returned</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_items_returned || 0}</div>
              <p className="text-xs text-muted-foreground">Total items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.total_refund_amount || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${parseFloat(stats.avg_refund_amount || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_sales_returned || 0}</div>
              <p className="text-xs text-muted-foreground">Unique sales affected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Return History</CardTitle>
              <CardDescription>Complete list of all product returns</CardDescription>
            </div>
            <div className="flex gap-4 items-end">
              <div className="w-48">
                <label className="text-sm font-medium text-muted-foreground">Filter by Outlet</label>
                <select 
                  value={outletFilter} 
                  onChange={(e) => {
                    setOutletFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white dark:bg-slate-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="">All Outlets</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No returns found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Restocked</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">#{returnItem.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Sale #{returnItem.sale_id}</Badge>
                      </TableCell>
                      <TableCell>{returnItem.product_name}</TableCell>
                      <TableCell>
                        {outlets.find(o => o.id === returnItem.outlet_id)?.name || (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {returnItem.customer_name || "Walk-in"}
                      </TableCell>
                      <TableCell>
                        {returnItem.quantity_returned} / {returnItem.original_quantity}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${parseFloat(returnItem.refund_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {returnItem.return_reason || "N/A"}
                      </TableCell>
                      <TableCell>
                        {returnItem.restocked ? (
                          <Badge variant="success" className="bg-green-100 text-green-800">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {returnItem.return_date
                          ? format(new Date(returnItem.return_date), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{returnItem.processed_by_name || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Return Reasons */}
      {stats?.top_reasons && stats.top_reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Return Reasons</CardTitle>
            <CardDescription>Most common reasons for returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_reasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{reason.return_reason || "No reason provided"}</p>
                    <p className="text-sm text-muted-foreground">{reason.count} returns</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${parseFloat(reason.total_refund).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">refunded</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
