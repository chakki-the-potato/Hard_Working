"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteAssetAction,
  uploadAssetAction,
} from "@/lib/content/admin-asset-actions";
import type { AdminContentAsset } from "@/lib/content/admin-asset-types";
import type { AdminMutationActionState } from "@/lib/content/admin-types";

type PostAssetManagerProps = Readonly<{
  itemId: string;
  assets: readonly AdminContentAsset[];
}>;

type AssetDeleteFormProps = Readonly<{
  asset: AdminContentAsset;
  itemId: string;
}>;

const INITIAL_UPLOAD_STATE: AdminMutationActionState = {
  status: "idle",
  message: null,
};
const INITIAL_MUTATION_STATE: AdminMutationActionState = {
  status: "idle",
  message: null,
};

function formatFileSize(byteSize: number): string {
  if (byteSize < 1024) {
    return `${byteSize} B`;
  }

  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }

  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="admin-button admin-button-danger admin-button-compact"
      disabled={pending}
      type="submit"
    >
      {pending ? "삭제 중" : "이미지 삭제"}
    </button>
  );
}

function AssetDeleteForm({ asset, itemId }: AssetDeleteFormProps) {
  const [state, formAction] = useActionState(
    deleteAssetAction,
    INITIAL_MUTATION_STATE,
  );

  return (
    <div className="admin-asset-delete">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("이 이미지를 삭제할까요?")) {
            event.preventDefault();
          }
        }}
      >
        <input name="itemId" type="hidden" value={itemId} />
        <input name="assetId" type="hidden" value={asset.id} />
        <AssetDeleteButton />
      </form>
      {state.message ? (
        <p className="admin-field-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function PostAssetManager({
  itemId,
  assets,
}: PostAssetManagerProps) {
  const [state, formAction, isPending] = useActionState(
    uploadAssetAction,
    INITIAL_UPLOAD_STATE,
  );
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copyErrorAssetId, setCopyErrorAssetId] = useState<string | null>(null);

  async function copyMarkdown(asset: AdminContentAsset): Promise<void> {
    try {
      await navigator.clipboard.writeText(asset.markdown);
      setCopiedAssetId(asset.id);
      setCopyErrorAssetId(null);
    } catch (error: unknown) {
      console.error("Markdown clipboard copy failed", {
        operation: "copy asset markdown",
        assetId: asset.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setCopiedAssetId(null);
      setCopyErrorAssetId(asset.id);
    }
  }

  return (
    <section className="admin-panel" aria-labelledby="post-assets-title">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Images</p>
          <h2 className="admin-section-title" id="post-assets-title">
            본문 이미지.
          </h2>
        </div>
        <p className="admin-panel-description">
          업로드한 뒤 Markdown을 복사해 본문에 붙여 넣으세요.
        </p>
      </div>

      <form action={formAction} className="admin-asset-upload">
        <input name="itemId" type="hidden" value={itemId} />

        {state.message ? (
          <p className="admin-notice" role="alert">
            {state.message}
          </p>
        ) : null}

        <label className="admin-field" htmlFor="asset-file">
          <span className="admin-field-label">이미지 파일</span>
          <input
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="admin-input"
            id="asset-file"
            name="file"
            required
            type="file"
          />
          <span className="admin-field-help">
            AVIF, GIF, JPEG, PNG, WebP 형식을 지원하며 최대 10MB입니다.
          </span>
        </label>

        <label className="admin-field" htmlFor="asset-alt-text">
          <span className="admin-field-label">대체 텍스트</span>
          <input
            className="admin-input"
            id="asset-alt-text"
            maxLength={300}
            name="altText"
            placeholder="이미지의 내용을 짧게 설명하세요."
            type="text"
          />
        </label>

        <div className="admin-actions">
          <button
            className="admin-button admin-button-primary"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "업로드 중" : "이미지 업로드"}
          </button>
        </div>
      </form>

      {assets.length === 0 ? (
        <p className="admin-panel-empty">아직 업로드한 이미지가 없습니다.</p>
      ) : (
        <ul className="admin-asset-list">
          {assets.map((asset) => (
            <li className="admin-asset-item" key={asset.id}>
              <img
                alt={asset.altText}
                className="admin-asset-preview"
                src={asset.publicUrl}
              />
              <div className="admin-asset-details">
                <p className="admin-asset-name">
                  {asset.altText || "대체 텍스트 없음"}
                </p>
                <p className="admin-asset-meta">
                  {asset.mimeType} · {formatFileSize(asset.byteSize)}
                </p>
                <code className="admin-asset-markdown">{asset.markdown}</code>
                <div className="admin-actions">
                  <button
                    className="admin-button admin-button-secondary admin-button-compact"
                    onClick={() => copyMarkdown(asset)}
                    type="button"
                  >
                    {copiedAssetId === asset.id
                      ? "복사됨"
                      : copyErrorAssetId === asset.id
                        ? "복사 실패"
                      : "Markdown 복사"}
                  </button>
                  <AssetDeleteForm asset={asset} itemId={itemId} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
