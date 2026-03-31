import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { paymentGatewayApi, type PaymentGateway, type PaymentStatusResponse } from "@/lib/paymentGatewayApi";

type CallbackStatus = "loading" | "success" | "failed" | "cancelled";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [paymentInfo, setPaymentInfo] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const gateway = searchParams.get("gateway") as PaymentGateway | null;
    if (!gateway) {
      setStatus("failed");
      setError("Invalid callback — missing gateway parameter.");
      return;
    }

    // Collect all query params to send to backend for validation
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    paymentGatewayApi
      .validateCallback(gateway, params)
      .then((res) => {
        setPaymentInfo(res);
        if (res.status === "success") setStatus("success");
        else if (res.status === "cancelled") setStatus("cancelled");
        else setStatus("failed");
      })
      .catch((err) => {
        setStatus("failed");
        setError(err.message || "Payment verification failed.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "loading" && "Verifying Payment..."}
            {status === "success" && "Payment Successful!"}
            {status === "failed" && "Payment Failed"}
            {status === "cancelled" && "Payment Cancelled"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-600" />}
          {status === "failed" && <XCircle className="h-12 w-12 text-destructive" />}
          {status === "cancelled" && <AlertTriangle className="h-12 w-12 text-yellow-500" />}

          {paymentInfo && status === "success" && (
            <div className="w-full rounded-md border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{paymentInfo.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">৳{paymentInfo.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{paymentInfo.gateway}</span>
              </div>
              {paymentInfo.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid at</span>
                  <span>{new Date(paymentInfo.paidAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          {status !== "loading" && (
            <div className="flex gap-2 w-full">
              <Link to="/invoices" className="flex-1">
                <Button variant="outline" className="w-full">Back to Invoices</Button>
              </Link>
              {status === "success" && (
                <Link to="/dashboard" className="flex-1">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              )}
              {(status === "failed" || status === "cancelled") && (
                <Link to="/invoices" className="flex-1">
                  <Button className="w-full">Try Again</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
