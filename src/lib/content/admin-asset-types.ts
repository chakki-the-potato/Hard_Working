export type AdminContentAsset = Readonly<{
  id: string;
  bucketId: string;
  storagePath: string;
  altText: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  publicUrl: string;
  markdown: string;
}>;
