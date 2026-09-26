// Reading a file the teacher picks for AI to read: a PDF or photo is sent as it is, and a
// text or CSV file as its text.

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const BINARY_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export type BinaryType = (typeof BINARY_TYPES)[number];

export type PickedFile =
  | { name: string; kind: "binary"; mediaType: BinaryType; data: string }
  | { name: string; kind: "text"; text: string };

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

const isText = (file: File) =>
  file.type.startsWith("text/") || /\.(txt|md|csv|tsv)$/i.test(file.name);

/** Reads a picked file; fails with a message fit to show if it's too big or can't be read. */
export async function readPickedFile(file: File): Promise<PickedFile> {
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is larger than 10 MB.");
  if (isText(file)) return { name: file.name, kind: "text", text: await file.text() };
  if (!(BINARY_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(
      "Use a PDF, a photo, or a text or CSV file. Save Word files as PDF, and Excel files as CSV.",
    );
  }
  return {
    name: file.name,
    kind: "binary",
    mediaType: file.type as BinaryType,
    data: await readAsBase64(file),
  };
}
