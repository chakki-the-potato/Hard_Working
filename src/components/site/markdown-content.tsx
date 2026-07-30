import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = Readonly<{
  markdown: string;
}>;

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <div className="prose">
      <ReactMarkdown
        components={{
          a({ href, children }) {
            const external = href?.startsWith("http") ?? false;
            return (
              <a
                href={href}
                rel={external ? "noopener noreferrer" : undefined}
                target={external ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            if (typeof src !== "string" || src === "") {
              return null;
            }

            return (
              <Image
                alt={alt ?? ""}
                height={675}
                sizes="(max-width: 720px) 100vw, 720px"
                src={src}
                unoptimized={src.startsWith("http")}
                width={1200}
              />
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
