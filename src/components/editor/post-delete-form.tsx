"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deletePostAction } from "@/lib/content/admin-post-delete-action";
import type { AdminMutationActionState } from "@/lib/content/admin-types";

type PostDeleteFormProps = Readonly<{
  itemId: string;
  title: string;
}>;

const INITIAL_DELETE_STATE: AdminMutationActionState = {
  status: "idle",
  message: null,
};

function DeletePostButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="admin-button admin-button-danger"
      disabled={pending}
      type="submit"
    >
      {pending ? "삭제 중" : "글 삭제"}
    </button>
  );
}

export function PostDeleteForm({ itemId, title }: PostDeleteFormProps) {
  const [state, formAction] = useActionState(
    deletePostAction,
    INITIAL_DELETE_STATE,
  );

  return (
    <section
      className="admin-panel admin-danger-zone"
      aria-labelledby="delete-post-title"
    >
      <div>
        <p className="admin-kicker">Danger zone</p>
        <h2 className="admin-section-title" id="delete-post-title">
          글 삭제.
        </h2>
        <p className="admin-panel-description">
          초안과 발행본, 연결된 이미지가 함께 삭제되며 복구할 수 없습니다.
        </p>
      </div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`“${title}” 글을 완전히 삭제할까요?`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="itemId" type="hidden" value={itemId} />
        <DeletePostButton />
        {state.message ? (
          <p className="admin-field-error" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
