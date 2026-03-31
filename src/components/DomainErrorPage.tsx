import { AlertTriangle, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DomainErrorPageProps {
  hostname: string;
  error?: string;
}

const DomainErrorPage = ({ hostname, error }: DomainErrorPageProps) => {
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "our platform";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Domain Not Found</h1>
            <p className="text-muted-foreground">
              The domain <strong className="text-foreground">{hostname}</strong> is not connected to any account.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground flex items-center justify-center gap-2">
              <Globe className="h-4 w-4" /> Possible reasons:
            </p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>The domain hasn't been configured yet</li>
              <li>DNS records are still propagating</li>
              <li>The tenant account has been suspended</li>
              <li>The subdomain doesn't exist</li>
            </ul>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/5 rounded p-2">
              Error: {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            <Button onClick={() => (window.location.href = `https://${appDomain}`)}>
              Visit Main Site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainErrorPage;
