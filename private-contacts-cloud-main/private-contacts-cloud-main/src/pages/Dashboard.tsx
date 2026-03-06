import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getContacts, deleteContact, getContactsCount, Contact } from "@/lib/contacts";
import { contactsToCsv, downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Search, LogOut, Users, Trash2, Pencil, Eye, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContactDialog from "@/components/ContactDialog";
import ContactDetailDialog from "@/components/ContactDetailDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CsvImportDialog from "@/components/CsvImportDialog";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => getContacts(search || undefined),
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ["contacts-count"],
    queryFn: getContactsCount,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      toast.success("Contact deleted");
      setDeletingId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Contact Manager
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold">{totalCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (contacts.length === 0) { toast.error("No contacts to export"); return; }
                downloadCsv(contactsToCsv(contacts), "contacts.csv");
                toast.success("Contacts exported");
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button onClick={() => { setEditingContact(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </div>
        </div>

        {/* Contact List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? "No contacts match your search." : "No contacts yet. Add your first contact!"}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border bg-card shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {contacts.map((c) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[200px]">{c.address || "—"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingContact(c)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingContact(c); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingId(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {contacts.map((c) => (
                <Card key={c.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">{c.name}</p>
                        {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                        {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingContact(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingContact(c); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editingContact}
      />

      <ContactDetailDialog
        contact={viewingContact}
        onClose={() => setViewingContact(null)}
      />

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        loading={deleteMutation.isPending}
      />

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
