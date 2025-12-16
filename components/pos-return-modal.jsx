"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { toast } from "../hooks/use-toast";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";

export default function POSReturnModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [saleSearch, setSaleSearch] = useState("");
  const [formData, setFormData] = useState({
    quantity_returned: 1,
    return_reason: "",
    restocked: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadRecentSales();
      setSelectedSale(null);
      setEligibility(null);
      setSaleSearch("");
      setFormData({
        quantity_returned: 1,
        return_reason: "",
        restocked: true,
      });
    }
  }, [isOpen]);

  const loadRecentSales = async () => {
    try {
      // Calculate date range: 7 days ago to now (using created_at timestamp)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      // Format dates with time for precise filtering
      // Start: 7 days ago at 00:00:00
      // End: Current moment
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      const response = await fetch(
        `/api/sales?limit=100&page=1&start_date=${startDateStr}&end_date=${endDateStr}`
      );
      const data = await response.json();
      if (response.ok) {
        setRecentSales(data.sales || []);
        if (!data.sales || data.sales.length === 0) {
          toast({
            title: "No Sales Found",
            description: "There are no sales from the last 7 days to process returns for.",
            variant: "default",
          });
        }
      } else {
        throw new Error(data.error || "Failed to load sales");
      }
    } catch (error) {
      console.error("Error loading sales:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load recent sales",
        variant: "destructive",
      });
    }
  };

  const handleSelectSale = async (sale) => {
    setSelectedSale(sale);
    setCheckingEligibility(true);
    
    try {
      const response = await fetch(
        `/api/returns?check_eligibility=true&sale_id=${sale.id}&product_id=${sale.product_id}`
      );
      const data = await response.json();
      setEligibility(data);
      
      if (data.eligible) {
        setFormData({
          ...formData,
          quantity_returned: Math.min(1, data.remainingQuantity),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check return eligibility",
        variant: "destructive",
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSale || !eligibility?.eligible) {
      toast({
        title: "Cannot Process Return",
        description: "Please select a valid sale",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity_returned > eligibility.remainingQuantity) {
      toast({
        title: "Invalid Quantity",
        description: `Maximum returnable quantity is ${eligibility.remainingQuantity}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sale_id: selectedSale.id,
          product_id: selectedSale.product_id,
          quantity_returned: parseFloat(formData.quantity_returned),
          return_reason: formData.return_reason,
          restocked: formData.restocked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process return");
      }

      toast({
        title: "Return Processed",
        description: `Successfully processed return. Refund: LKR ${data.refund_amount.toFixed(2)}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRefundAmount = () => {
    if (!eligibility?.sale) return 0;
    const pricePerUnit = eligibility.sale.total_amount / eligibility.sale.quantity;
    return pricePerUnit * formData.quantity_returned;
  };

  const filteredSales = saleSearch
    ? recentSales.filter(
        (sale) =>
          sale.return !== false && (
            sale.id.toString().includes(saleSearch) ||
            sale.product_name?.toLowerCase().includes(saleSearch.toLowerCase()) ||
            sale.sku?.toLowerCase().includes(saleSearch.toLowerCase())
          )
      )
    : recentSales.filter(sale => sale.return !== false).slice(0, 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Return - POS</DialogTitle>
          <DialogDescription>
            Select a sale from the last 7 days and process the return
          </DialogDescription>
        </DialogHeader>

        {!selectedSale ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Sale ID, Product Name, or SKU..."
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Recent Sales Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground font-medium">
                            {saleSearch ? "No sales match your search" : "No recent sales found"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {saleSearch 
                              ? "Try a different search term" 
                              : "Complete some sales in POS to process returns"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">#{sale.id}</TableCell>
                        <TableCell>{sale.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{sale.sku || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>LKR {parseFloat(sale.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          {sale.return_status === "full" ? (
                            <Badge variant="destructive">Fully Returned</Badge>
                          ) : sale.return_status === "partial" ? (
                            <Badge variant="secondary">Partially Returned</Badge>
                          ) : sale.return === false ? (
                            <Badge variant="destructive">Not Returnable</Badge>
                          ) : (
                            <Badge variant="outline">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectSale(sale)}
                            disabled={sale.return_status === "full" || sale.return === false}
                            title={sale.return === false ? "This product is not available for return" : ""}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Show close button if no sales */}
            {recentSales.length === 0 && !saleSearch && (
              <div className="flex justify-center pt-4">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            )}
          </div>
        ) : checkingEligibility ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !eligibility?.eligible ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{eligibility?.reason || "This item cannot be returned"}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => setSelectedSale(null)}>
              Back to Sales List
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sale Info */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Sale ID:</span>
                  <p className="text-muted-foreground">#{selectedSale.id}</p>
                </div>
                <div>
                  <span className="font-medium">Product:</span>
                  <p className="text-muted-foreground">{eligibility.sale.product_name}</p>
                </div>
                <div>
                  <span className="font-medium">Original Quantity:</span>
                  <p className="text-muted-foreground">{eligibility.sale.quantity}</p>
                </div>
                <div>
                  <span className="font-medium">Already Returned:</span>
                  <p className="text-muted-foreground">{eligibility.sale.already_returned}</p>
                </div>
                <div>
                  <span className="font-medium">Available to Return:</span>
                  <p className="text-primary font-bold">{eligibility.remainingQuantity}</p>
                </div>
              </div>
            </div>

            {/* Return Form */}
            <div className="space-y-2">
              <Label htmlFor="quantity_returned">Quantity to Return *</Label>
              <Input
                id="quantity_returned"
                type="number"
                min="1"
                max={eligibility.remainingQuantity}
                value={formData.quantity_returned}
                onChange={(e) =>
                  setFormData({ ...formData, quantity_returned: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {eligibility.remainingQuantity} items
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_reason">Return Reason</Label>
              <Textarea
                id="return_reason"
                placeholder="Enter reason for return (optional)"
                value={formData.return_reason}
                onChange={(e) =>
                  setFormData({ ...formData, return_reason: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="restocked"
                checked={formData.restocked}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, restocked: checked })
                }
              />
              <Label
                htmlFor="restocked"
                className="text-sm font-normal cursor-pointer"
              >
                Add items back to inventory
              </Label>
            </div>

            {/* Refund Amount */}
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Refund Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  LKR {calculateRefundAmount().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSale(null)}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Return"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
