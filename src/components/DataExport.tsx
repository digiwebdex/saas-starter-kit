import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Database } from "lucide-react";
import { exportResource, exportAllData, getExportResources, type ExportResult, type ExportResource } from "@/lib/exportApi";

const resources = getExportResources();

const DataExport = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [results, setResults] = useState<ExportResult[]>([]);
  const { toast } = useToast();

  const handleExportSingle = async (id: ExportResource) => {
    setExporting(id);
    const result = await exportResource(id);
    setResults((prev) => [...prev.filter((r) => r.resource !== result.resource), result]);
    if (result.success) {
      toast({ title: `${result.resource} exported`, description: `${result.count} records downloaded as CSV` });
    } else {
      toast({ title: "Export failed", description: result.error, variant: "destructive" });
    }
    setExporting(null);
  };

  const handleExportAll = async () => {
    setExporting("all");
    const allResults = await exportAllData();
    setResults(allResults);
    const successCount = allResults.filter((r) => r.success).length;
    toast({ title: "Bulk export complete", description: `${successCount}/${allResults.length} resources exported` });
    setExporting(null);
  };

  const getResultForResource = (label: string) => results.find((r) => r.resource === label);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Data Export & Backup
            </CardTitle>
            <CardDescription>Download your data as CSV files for backup or migration</CardDescription>
          </div>
          <Button onClick={handleExportAll} disabled={!!exporting} variant="outline">
            {exporting === "all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => {
            const result = getResultForResource(res.label);
            const isExporting = exporting === res.id;

            return (
              <div key={res.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{res.label}</p>
                    {result && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {result.success ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">{result.count} records</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span className="text-xs text-destructive">{result.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!!exporting}
                  onClick={() => handleExportSingle(res.id)}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> For automated daily backups, set up a cron job on your server:
          </p>
          <code className="block mt-1 text-xs bg-muted p-2 rounded font-mono">
            0 2 * * * cd /var/www/backend && node scripts/backup.js &gt;&gt; /var/log/backup.log 2&gt;&amp;1
          </code>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;
