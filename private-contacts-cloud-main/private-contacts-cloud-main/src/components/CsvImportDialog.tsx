import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createContact, ContactInsert } from "@/lib/contacts";
import { parseCsv } from "@/lib/csv";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CsvImportDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ contacts: ContactInsert[]; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview || !user) return;
    setImporting(true);
    let success = 0;
    for (const c of preview.contacts) {
      try {
        await createContact(c, user.id);
        success++;
      } catch {
        // skip failed rows
      }
    }
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
    toast.success(`Imported ${success} of ${preview.contacts.length} contacts`);
    setPreview(null);
    setImporting(false);
    onOpenChange(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: Name, Phone, Email, Address, Notes. The Name column is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>

          {preview && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Found {preview.contacts.length} valid contact{preview.contacts.length !== 1 ? "s" : ""}
              </p>
              {preview.errors.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded border p-2">
                  {preview.errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={!preview || preview.contacts.length === 0 || importing}
            >
              <Upload className="h-4 w-4 mr-1" />
              {importing ? "Importing..." : `Import ${preview?.contacts.length ?? 0} contacts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
