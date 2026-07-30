export type EditorDestination = "admin" | "writer";

export function parseEditorDestination(
  formData: FormData,
): EditorDestination | null {
  const value = formData.get("editorDestination");

  if (value === "admin" || value === "writer") {
    return value;
  }

  return null;
}

export function getEditorPostPath(
  destination: EditorDestination,
  itemId: string,
): string {
  return getEditorFormPath(destination, itemId);
}

export function getEditorFormPath(
  destination: EditorDestination,
  itemId: string | null,
): string {
  if (destination === "writer") {
    return itemId ? `/write/${itemId}` : "/write";
  }

  return itemId ? `/admin/posts/${itemId}` : "/admin/posts/new";
}
