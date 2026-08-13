import assert from "node:assert/strict";
import test from "node:test";
import {
  getContentImportControls,
  runContentImportWithPolicy,
} from "../src/lib/content/import-policy.ts";

test("production blocks apply before the import executor runs", async () => {
  let executionCount = 0;

  const result = await runContentImportWithPolicy(
    "apply",
    "production",
    async () => {
      executionCount += 1;
      return "executed";
    },
  );

  assert.deepEqual(result, { status: "blocked" });
  assert.equal(executionCount, 0);
});

test("non-production apply and every dry-run reach the import executor", async () => {
  for (const [mode, environment] of [
    ["apply", "preview"],
    ["apply", "development"],
    ["apply", undefined],
    ["dry-run", "production"],
  ]) {
    let executionCount = 0;
    const result = await runContentImportWithPolicy(
      mode,
      environment,
      async () => {
        executionCount += 1;
        return "executed";
      },
    );

    assert.deepEqual(result, { status: "executed", value: "executed" });
    assert.equal(executionCount, 1);
  }
});

test("production controls keep dry-run and remove apply", () => {
  assert.deepEqual(getContentImportControls("production"), {
    allowDryRun: true,
    allowApply: false,
  });
  assert.deepEqual(getContentImportControls("preview"), {
    allowDryRun: true,
    allowApply: true,
  });
});
