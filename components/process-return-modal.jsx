"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { toast } from "../hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export default function ProcessReturnModal({ isOpen, onClose, sale, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [formData, setFormData] = useState({
    quantity_returned: 1,
    return_reason: "",
    restocked: true,
  });

  useEffect(() => {
    if (isOpen && sale) {
      checkEligibility();
      setFormData({
        quantity_returned: 1,
        return_reason: "",
        restocked: true,
      });
    }
  }, [isOpen, sale]);

  const checkEligibility = async () => {
    if (!sale) return;

    setCheckingEligibility(true);
    try {
      const response = await fetch(
        `/api/returns?check_eligibility=true&sale_id=${sale.id}&product_id=${sale.product_id}`
      );
      const data = await response.json();
      setEligibility(data);
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

    if (!eligibility?.eligible) {
      toast({
        title: "Cannot Process Return",
        description: eligibility?.reason || "This item is not eligible for return",
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
          sale_id: sale.id,
          product_id: sale.product_id,
          quantity_returned: parseInt(formData.quantity_returned),
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
        description: `Successfully processed return. Refund amount: $${data.refund_amount.toFixed(2)}`,
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

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Return</DialogTitle>
          <DialogDescription>
            Process a return for this sale item
          </DialogDescription>
        </DialogHeader>

        {checkingEligibility ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !eligibility?.eligible ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{eligibility?.reason || "This item cannot be returned"}</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
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
                  <span className="font-medium">Returnable:</span>
                  <p className="text-muted-foreground">{eligibility.remainingQuantity}</p>
                </div>
              </div>
            </div>

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

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Refund Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  ${calculateRefundAmount().toFixed(2)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Return"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
