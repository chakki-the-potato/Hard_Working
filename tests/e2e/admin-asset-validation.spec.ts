import { expect, test } from "@playwright/test";
import {
  MAX_CONTENT_ASSET_BYTES,
  parseUploadAssetFormData,
} from "../../src/lib/content/admin-asset-validation";

const ITEM_ID = "52f5b813-c095-40cf-8664-4013a231f063";

function createFormData(file: File, altText = ""): FormData {
  const formData = new FormData();
  formData.set("itemId", ITEM_ID);
  formData.set("altText", altText);
  formData.set("file", file);
  return formData;
}

test("accepts a supported image and creates an item-scoped storage path", async () => {
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const result = await parseUploadAssetFormData(
    createFormData(new File([pngBytes], "sample.png", { type: "image/png" })),
  );

  expect(result.ok).toBe(true);

  if (result.ok) {
    expect(result.input.storagePath).toMatch(
      new RegExp(`^${ITEM_ID}/[0-9a-f-]+\\.png$`),
    );
  }
});

test("rejects unsupported files and images over the bucket limit", async () => {
  const unsupported = await parseUploadAssetFormData(
    createFormData(new File(["text"], "sample.txt", { type: "text/plain" })),
  );
  const oversized = await parseUploadAssetFormData(
    createFormData(
      new File(
        [new Uint8Array(MAX_CONTENT_ASSET_BYTES + 1)],
        "oversized.webp",
        { type: "image/webp" },
      ),
    ),
  );

  expect(unsupported).toMatchObject({
    ok: false,
    state: {
      message: "AVIF, GIF, JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.",
    },
  });
  expect(oversized).toMatchObject({
    ok: false,
    state: {
      message: "이미지는 10MB 이하만 업로드할 수 있습니다.",
    },
  });
});

test("rejects a file whose content does not match its image type", async () => {
  const result = await parseUploadAssetFormData(
    createFormData(
      new File(["not a png"], "spoofed.png", { type: "image/png" }),
    ),
  );

  expect(result).toMatchObject({
    ok: false,
    state: {
      message: "파일 내용과 이미지 형식이 일치하지 않습니다.",
    },
  });
});
