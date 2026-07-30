import type { AdminMutationActionState } from "@/lib/content/admin-types";
import { isUuid } from "@/lib/content/admin-validation";

export const CONTENT_ASSET_BUCKET = "content-assets";
export const MAX_CONTENT_ASSET_BYTES = 10 * 1024 * 1024;

const MAX_ALT_TEXT_LENGTH = 300;
const MIME_TYPE_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadAssetInput = Readonly<{
  itemId: string;
  altText: string;
  file: File;
  storagePath: string;
}>;

type ParseUploadAssetResult =
  | Readonly<{
      ok: true;
      input: UploadAssetInput;
    }>
  | Readonly<{
      ok: false;
      state: AdminMutationActionState;
    }>;

type AssetIdentity =
  | Readonly<{
      ok: true;
      itemId: string;
      assetId: string;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }>;

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorState(message: string): ParseUploadAssetResult {
  return {
    ok: false,
    state: {
      status: "error",
      message,
    },
  };
}

function bytesMatch(
  bytes: Uint8Array,
  offset: number,
  signature: readonly number[],
): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function hasMatchingImageSignature(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  if (mimeType === "image/jpeg") {
    return bytesMatch(bytes, 0, [0xff, 0xd8, 0xff]);
  }

  if (mimeType === "image/png") {
    return bytesMatch(bytes, 0, [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  }

  if (mimeType === "image/gif") {
    return (
      bytesMatch(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      bytesMatch(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
    );
  }

  if (mimeType === "image/webp") {
    return (
      bytesMatch(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
      bytesMatch(bytes, 8, [0x57, 0x45, 0x42, 0x50])
    );
  }

  if (
    mimeType === "image/avif" &&
    bytesMatch(bytes, 4, [0x66, 0x74, 0x79, 0x70])
  ) {
    for (let offset = 8; offset + 4 <= bytes.length; offset += 4) {
      if (
        bytesMatch(bytes, offset, [0x61, 0x76, 0x69, 0x66]) ||
        bytesMatch(bytes, offset, [0x61, 0x76, 0x69, 0x73])
      ) {
        return true;
      }
    }
  }

  return false;
}

export async function parseUploadAssetFormData(
  formData: FormData,
): Promise<ParseUploadAssetResult> {
  const itemId = getFormString(formData, "itemId");
  const altText = getFormString(formData, "altText");
  const file = formData.get("file");

  if (!isUuid(itemId)) {
    return errorState("이미지를 연결할 글을 확인할 수 없습니다.");
  }

  if (!(file instanceof File) || file.size === 0) {
    return errorState("업로드할 이미지를 선택해 주세요.");
  }

  const extension = MIME_TYPE_EXTENSIONS[file.type];

  if (!extension) {
    return errorState("AVIF, GIF, JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.");
  }

  if (file.size > MAX_CONTENT_ASSET_BYTES) {
    return errorState("이미지는 10MB 이하만 업로드할 수 있습니다.");
  }

  if (altText.length > MAX_ALT_TEXT_LENGTH) {
    return errorState("대체 텍스트는 300자 이내로 입력해 주세요.");
  }

  const headerBytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  if (!hasMatchingImageSignature(file.type, headerBytes)) {
    return errorState("파일 내용과 이미지 형식이 일치하지 않습니다.");
  }

  return {
    ok: true,
    input: {
      itemId,
      altText,
      file,
      storagePath: `${itemId}/${crypto.randomUUID()}.${extension}`,
    },
  };
}

export function parseAssetIdentity(formData: FormData): AssetIdentity {
  const itemId = getFormString(formData, "itemId");
  const assetId = getFormString(formData, "assetId");

  if (!isUuid(itemId) || !isUuid(assetId)) {
    return {
      ok: false,
      message: "삭제할 이미지 정보를 확인할 수 없습니다.",
    };
  }

  return {
    ok: true,
    itemId,
    assetId,
  };
}
