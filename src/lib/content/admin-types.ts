export type CategoryOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type AdminMutationActionState = Readonly<{
  status: "idle" | "error";
  message: string | null;
}>;
