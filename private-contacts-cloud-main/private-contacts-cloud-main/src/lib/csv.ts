import { Contact, ContactInsert } from "@/lib/contacts";

const CSV_HEADERS = ["Name", "Phone", "Email", "Address", "Notes"];
const CSV_FIELDS: (keyof Contact)[] = ["name", "phone", "email", "address", "notes"];

function escapeCsvField(value: string | null): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function contactsToCsv(contacts: Contact[]): string {
  const header = CSV_HEADERS.join(",");
  const rows = contacts.map((c) =>
    CSV_FIELDS.map((f) => escapeCsvField(c[f] as string | null)).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCsv(text: string): { contacts: ContactInsert[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { contacts: [], errors: ["CSV file is empty or has no data rows."] };

  const headerLine = lines[0].toLowerCase();
  const headers = parseCsvLine(headerLine);
  
  const nameIdx = headers.findIndex((h) => h === "name");
  const phoneIdx = headers.findIndex((h) => h === "phone");
  const emailIdx = headers.findIndex((h) => h === "email");
  const addressIdx = headers.findIndex((h) => h === "address");
  const notesIdx = headers.findIndex((h) => h === "notes");

  if (nameIdx === -1) return { contacts: [], errors: ["CSV must have a 'Name' column."] };

  const contacts: ContactInsert[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const name = fields[nameIdx]?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Name is empty, skipped.`);
      continue;
    }
    if (name.length > 100) {
      errors.push(`Row ${i + 1}: Name too long, skipped.`);
      continue;
    }
    contacts.push({
      name,
      phone: phoneIdx >= 0 ? fields[phoneIdx] || null : null,
      email: emailIdx >= 0 ? fields[emailIdx] || null : null,
      address: addressIdx >= 0 ? fields[addressIdx] || null : null,
      notes: notesIdx >= 0 ? fields[notesIdx] || null : null,
    });
  }

  return { contacts, errors };
}
