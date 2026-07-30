import type { StorageError } from "@supabase/storage-js";
import type { ServerSupabaseClient } from "@/lib/auth/require-admin";

const MAX_REMOVE_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;
const MAX_OBJECTS_PER_REMOVE = 1000;

export type StorageObjectIdentity = Readonly<{
  bucketId: string;
  storagePath: string;
}>;

export type StorageCleanupFailure = Readonly<{
  bucketId: string;
  storagePaths: readonly string[];
  error: StorageError;
}>;

async function wait(delayMs: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function removeChunk(
  supabase: ServerSupabaseClient,
  bucketId: string,
  storagePaths: readonly string[],
): Promise<StorageCleanupFailure | null> {
  let lastError: StorageError | null = null;

  for (let attempt = 1; attempt <= MAX_REMOVE_ATTEMPTS; attempt += 1) {
    const { error } = await supabase.storage
      .from(bucketId)
      .remove([...storagePaths]);

    if (!error) {
      return null;
    }

    lastError = error;

    if (attempt < MAX_REMOVE_ATTEMPTS) {
      console.warn("Supabase Storage removal failed; retrying", {
        operation: "remove content assets",
        bucketId,
        storagePaths,
        attempt,
        message: error.message,
        statusCode: error.statusCode,
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  if (!lastError) {
    throw new Error("Storage removal failed without an error response");
  }

  return {
    bucketId,
    storagePaths,
    error: lastError,
  };
}

export async function removeStorageObjects(
  supabase: ServerSupabaseClient,
  objects: readonly StorageObjectIdentity[],
): Promise<readonly StorageCleanupFailure[]> {
  const pathsByBucket = new Map<string, string[]>();

  for (const object of objects) {
    const paths = pathsByBucket.get(object.bucketId) ?? [];
    paths.push(object.storagePath);
    pathsByBucket.set(object.bucketId, paths);
  }

  const removals: Promise<StorageCleanupFailure | null>[] = [];

  for (const [bucketId, storagePaths] of pathsByBucket) {
    for (
      let offset = 0;
      offset < storagePaths.length;
      offset += MAX_OBJECTS_PER_REMOVE
    ) {
      removals.push(
        removeChunk(
          supabase,
          bucketId,
          storagePaths.slice(offset, offset + MAX_OBJECTS_PER_REMOVE),
        ),
      );
    }
  }

  const results = await Promise.all(removals);
  return results.filter(
    (result): result is StorageCleanupFailure => result !== null,
  );
}
