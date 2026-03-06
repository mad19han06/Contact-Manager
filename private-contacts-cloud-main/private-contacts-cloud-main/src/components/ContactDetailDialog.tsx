import { Contact } from "@/lib/contacts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Props {
  contact: Contact | null;
  onClose: () => void;
}

export default function ContactDetailDialog({ contact, onClose }: Props) {
  if (!contact) return null;

  const fields = [
    { label: "Phone", value: contact.phone },
    { label: "Email", value: contact.email },
    { label: "Address", value: contact.address },
    { label: "Notes", value: contact.notes },
    { label: "Created", value: format(new Date(contact.created_at), "MMM d, yyyy") },
  ];

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{contact.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-medium">{value || "—"}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
