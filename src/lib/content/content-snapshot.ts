import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type {
  ContentImportSnapshot,
  ImportContentItem,
  ImportContentKind,
  ImportContentRedirect,
  ImportContentTag,
} from "@/lib/content/migration-types";

const MAX_FILE_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 100;
const CONTENT_ROOT = path.join(process.cwd(), "src", "data");
const REDIRECT_MAP_PATH = path.join(
  process.cwd(),
  "scripts",
  "redirect-map.json",
);
const VALID_CATEGORIES = new Set([
  "programming",
  "design",
  "thinking",
  "works",
]);
const VALID_PROJECT_STATUSES = new Set(["active", "archived", "paused"]);

type Frontmatter = Readonly<Record<string, unknown>>;

type MarkdownSource = Readonly<{
  absolutePath: string;
  relativePath: string;
  data: Frontmatter;
  bodyMarkdown: string;
}>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function readTextFile(filePath: string): Promise<string> {
  let lastError: NodeJS.ErrnoException | null = null;

  for (let attempt = 1; attempt <= MAX_FILE_ATTEMPTS; attempt += 1) {
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      lastError = error as NodeJS.ErrnoException;

      if (
        !["EBUSY", "EIO", "EMFILE", "ENFILE"].includes(lastError.code ?? "") ||
        attempt === MAX_FILE_ATTEMPTS
      ) {
        break;
      }

      console.warn(
        JSON.stringify({
          event: "content_snapshot_file_retry",
          path: filePath,
          attempt,
          code: lastError.code,
        }),
      );
      await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `콘텐츠 파일을 읽지 못했습니다. path=${filePath}, cause=${lastError?.message ?? "unknown"}. 파일 접근 권한과 경로를 확인하세요.`,
    { cause: lastError },
  );
}

async function listMarkdownFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return listMarkdownFiles(entryPath);
      }

      return entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat().sort();
}

async function loadMarkdownSources(
  collectionName: "blog" | "ideas" | "projects",
): Promise<MarkdownSource[]> {
  const collectionRoot = path.join(CONTENT_ROOT, collectionName);
  const filePaths = await listMarkdownFiles(collectionRoot);

  return Promise.all(
    filePaths.map(async (absolutePath) => {
      const source = await readTextFile(absolutePath);
      const parsed = matter(source);

      return {
        absolutePath,
        relativePath: path
          .relative(collectionRoot, absolutePath)
          .split(path.sep)
          .join("/"),
        data: parsed.data,
        bodyMarkdown: parsed.content.trim(),
      };
    }),
  );
}

function requireString(
  data: Frontmatter,
  key: string,
  sourcePath: string,
): string {
  const value = data[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `필수 frontmatter가 없습니다. path=${sourcePath}, field=${key}.`,
    );
  }

  return value.trim();
}

function optionalString(data: Frontmatter, key: string): string | null {
  const value = data[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : null;
}

function requireDate(
  data: Frontmatter,
  key: string,
  sourcePath: string,
): Date {
  const value = data[key];
  const date = value instanceof Date ? value : new Date(String(value ?? ""));

  if (Number.isNaN(date.valueOf())) {
    throw new Error(
      `유효한 날짜가 아닙니다. path=${sourcePath}, field=${key}.`,
    );
  }

  return date;
}

function readCategory(data: Frontmatter, sourcePath: string): string {
  const category = requireString(data, "category", sourcePath);

  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(
      `지원하지 않는 카테고리입니다. path=${sourcePath}, category=${category}.`,
    );
  }

  return category;
}

function readTags(data: Frontmatter, sourcePath: string): ImportContentTag[] {
  const value = data.tags;

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error(
      `tags는 문자열 배열이어야 합니다. path=${sourcePath}.`,
    );
  }

  return value.map((tag) => {
    const name = tag.trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (name === "" || slug === "") {
      throw new Error(
        `태그를 영문 slug로 변환할 수 없습니다. path=${sourcePath}, tag=${tag}.`,
      );
    }

    return { name, slug };
  });
}

function flattenContentPath(relativePath: string): string[] {
  const parts = relativePath.replace(/\.md$/, "").split("/");

  if (parts.length === 3 && /^\d{4}$/.test(parts[1])) {
    return [parts[0], parts[2]];
  }

  return parts;
}

function buildItem(
  source: MarkdownSource,
  kind: Exclude<ImportContentKind, "project">,
): ImportContentItem {
  const contentParts = flattenContentPath(source.relativePath);
  const slug = contentParts.at(-1);

  if (!slug) {
    throw new Error(`콘텐츠 slug를 만들 수 없습니다. path=${source.relativePath}.`);
  }

  if (source.data.draft === true) {
    throw new Error(
      `현재 일괄 이전은 공개 콘텐츠만 지원합니다. path=${source.relativePath}.`,
    );
  }

  const categorySlug = readCategory(source.data, source.relativePath);
  const project = optionalString(source.data, "project");

  return {
    kind,
    slug,
    path: `/${kind === "post" ? "posts" : "ideas"}/${contentParts.join("/")}`,
    parentPath: project ? `/projects/${project}` : null,
    title: requireString(source.data, "title", source.relativePath),
    description:
      kind === "post"
        ? requireString(source.data, "description", source.relativePath)
        : null,
    summary: null,
    bodyMarkdown: source.bodyMarkdown,
    categorySlug,
    versionLabel: optionalString(source.data, "version"),
    tags: readTags(source.data, source.relativePath),
    demoUrl: optionalString(source.data, "demoUrl"),
    repositoryUrl: optionalString(source.data, "repoUrl"),
    role: optionalString(source.data, "role"),
    period: optionalString(source.data, "period"),
    outcome: optionalString(source.data, "outcome"),
    publishedAt: requireDate(
      source.data,
      "pubDate",
      source.relativePath,
    ).toISOString(),
    projectStatus: null,
    projectSortOrder: null,
  };
}

function findProjectPublishedAt(
  projectSlug: string,
  blogItems: readonly ImportContentItem[],
  source: MarkdownSource,
): Promise<string> {
  const linkedDates = blogItems
    .filter((item) => item.parentPath === `/projects/${projectSlug}`)
    .map((item) => new Date(item.publishedAt).valueOf())
    .sort((left, right) => left - right);

  if (linkedDates.length > 0) {
    return Promise.resolve(new Date(linkedDates[0]).toISOString());
  }

  return stat(source.absolutePath).then((fileStat) =>
    fileStat.birthtime.toISOString(),
  );
}

async function buildProjectItem(
  source: MarkdownSource,
  blogItems: readonly ImportContentItem[],
): Promise<ImportContentItem> {
  const slug = source.relativePath.replace(/\.md$/, "");
  const status = optionalString(source.data, "status") ?? "active";

  if (!VALID_PROJECT_STATUSES.has(status)) {
    throw new Error(
      `지원하지 않는 프로젝트 상태입니다. path=${source.relativePath}, status=${status}.`,
    );
  }

  const order = source.data.order;
  if (order !== undefined && (!Number.isInteger(order) || Number(order) < 0)) {
    throw new Error(
      `프로젝트 order는 0 이상의 정수여야 합니다. path=${source.relativePath}.`,
    );
  }

  const primaryCategory = optionalString(source.data, "primaryCategory");
  if (primaryCategory && !VALID_CATEGORIES.has(primaryCategory)) {
    throw new Error(
      `지원하지 않는 프로젝트 카테고리입니다. path=${source.relativePath}.`,
    );
  }

  return {
    kind: "project",
    slug,
    path: `/projects/${slug}`,
    parentPath: null,
    title: requireString(source.data, "title", source.relativePath),
    description: null,
    summary: requireString(source.data, "summary", source.relativePath),
    bodyMarkdown: source.bodyMarkdown,
    categorySlug: primaryCategory,
    versionLabel: null,
    tags: readTags(source.data, source.relativePath),
    demoUrl: optionalString(source.data, "demoUrl"),
    repositoryUrl: optionalString(source.data, "repoUrl"),
    role: null,
    period: optionalString(source.data, "period"),
    outcome: null,
    publishedAt: await findProjectPublishedAt(slug, blogItems, source),
    projectStatus: status as "active" | "archived" | "paused",
    projectSortOrder: order === undefined ? 0 : Number(order),
  };
}

async function loadRedirects(): Promise<ImportContentRedirect[]> {
  const source = await readTextFile(REDIRECT_MAP_PATH);
  const parsed: unknown = JSON.parse(source);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      `리디렉션 맵 형식이 올바르지 않습니다. path=${REDIRECT_MAP_PATH}.`,
    );
  }

  return Object.entries(parsed).map(([sourcePath, target]) => {
    if (typeof target !== "string") {
      throw new Error(
        `리디렉션 대상은 문자열이어야 합니다. source=${sourcePath}.`,
      );
    }

    return {
      sourcePath,
      targetPath: target.replace(/^\/Hard_Working/, ""),
    };
  });
}

export async function buildContentImportSnapshot(): Promise<ContentImportSnapshot> {
  const [blogSources, ideaSources, projectSources, redirects] =
    await Promise.all([
      loadMarkdownSources("blog"),
      loadMarkdownSources("ideas"),
      loadMarkdownSources("projects"),
      loadRedirects(),
    ]);

  const blogItems = blogSources.map((source) => buildItem(source, "post"));
  const ideaItems = ideaSources.map((source) => buildItem(source, "idea"));
  const projectItems = await Promise.all(
    projectSources.map((source) => buildProjectItem(source, blogItems)),
  );
  const items = [...projectItems, ...blogItems, ...ideaItems];
  const uniquePaths = new Set(items.map((item) => item.path));

  if (uniquePaths.size !== items.length) {
    throw new Error(
      `중복 콘텐츠 경로가 있습니다. items=${items.length}, uniquePaths=${uniquePaths.size}.`,
    );
  }

  for (const redirect of redirects) {
    if (!uniquePaths.has(redirect.targetPath)) {
      throw new Error(
        `리디렉션 대상 콘텐츠가 없습니다. source=${redirect.sourcePath}, target=${redirect.targetPath}.`,
      );
    }
  }

  return { items, redirects };
}
