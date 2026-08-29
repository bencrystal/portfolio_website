import JSZip from "jszip";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { marked } from "marked";
import mammoth from "mammoth";

export interface ConvertResult {
  title: string;
  epub: Buffer;
}

export type ConvertInput =
  | { kind: "file"; name: string; buf: Buffer }
  | { kind: "url"; url: string };

// SD-safe ASCII filename ending in .epub. De-duping against existing names
// is the caller's job (DB unique constraint backs it up).
export function sanitizeFilename(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^A-Za-z0-9._ -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .trim();
  return `${base || `inkdrop-${Date.now()}`}.epub`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sanitize arbitrary HTML into well-formed XHTML body markup that
// CrossPoint's expat parser (XML_GE=0, strict XML) will accept.
// Images are stripped: remote/data URIs cannot resolve on the offline device.
function toXhtmlBody(html: string): string {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const { document } = dom.window;
  document
    .querySelectorAll("script, style, iframe, form, noscript, video, audio, canvas, svg, img, picture, source, button, input, link, meta")
    .forEach((el) => el.remove());
  // Strip all attributes except a small allowlist; on-device CSS is minimal
  // and stray attributes (event handlers, data-*) are dead weight.
  const keep = new Set(["href", "id", "colspan", "rowspan"]);
  document.body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (!keep.has(attr.name)) el.removeAttribute(attr.name);
    }
  });
  const serializer = new dom.window.XMLSerializer();
  let out = "";
  document.body.childNodes.forEach((node) => {
    out += serializer.serializeToString(node);
  });
  // XMLSerializer stamps the XHTML namespace on each top-level element;
  // harmless but noisy. The root <html> already declares it.
  return out.replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "");
}

// Minimal EPUB2: mimetype (stored, first), container.xml, OPF, NCX, one
// XHTML chapter. Boring on purpose; the target parser is an ESP32.
export async function htmlToEpub(title: string, bodyHtml: string): Promise<Buffer> {
  const safeTitle = escapeXml(title);
  let body = toXhtmlBody(bodyHtml);
  // Avoid a doubled heading when the content already opens with one.
  if (!/^\s*<h1[\s>]/.test(body)) {
    body = `<h1>${safeTitle}</h1>\n${body}`;
  }
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );
  const uid = `inkdrop-${Date.now()}`;
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Inkdrop</dc:creator>
    <dc:identifier id="uid">${uid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
</package>`
  );
  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${uid}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>
    <navPoint id="np1" playOrder="1">
      <navLabel><text>${safeTitle}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`
  );
  zip.file("OEBPS/style.css", "body { margin: 0; }\n");
  zip.file(
    "OEBPS/chapter1.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${safeTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${body}
</body>
</html>`
  );
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function textToHtml(text: string): string {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeXml(p).replace(/\r?\n/g, " ")}</p>`)
    .join("\n");
}

function titleFromName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";
}

async function convertUrl(url: string): Promise<ConvertResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  if (!article || !article.content) throw new Error("could not extract article");
  const title = article.title?.trim() || new URL(url).hostname;
  return { title, epub: await htmlToEpub(title, article.content) };
}

export async function convert(input: ConvertInput): Promise<ConvertResult> {
  if (input.kind === "url") return convertUrl(input.url);

  const { name, buf } = input;
  const ext = (name.match(/\.([^.]+)$/)?.[1] || "").toLowerCase();
  const title = titleFromName(name);

  switch (ext) {
    case "epub": {
      if (buf.length < 4 || buf.readUInt32BE(0) !== 0x504b0304) {
        throw new Error("not a valid EPUB (zip signature missing)");
      }
      return { title, epub: buf };
    }
    case "md":
    case "markdown": {
      const html = await marked.parse(buf.toString("utf8"));
      return { title, epub: await htmlToEpub(title, html) };
    }
    case "txt":
      return { title, epub: await htmlToEpub(title, textToHtml(buf.toString("utf8"))) };
    case "html":
    case "htm": {
      // Readability strips nav/boilerplate; fall back to raw body.
      const dom = new JSDOM(buf.toString("utf8"));
      const article = new Readability(dom.window.document).parse();
      const content = article?.content || dom.window.document.body.innerHTML;
      const t = article?.title?.trim() || title;
      return { title: t, epub: await htmlToEpub(t, content) };
    }
    case "docx": {
      const { value } = await mammoth.convertToHtml({ buffer: buf });
      return { title, epub: await htmlToEpub(title, value) };
    }
    case "pdf": {
      // Lazy import: pdfjs-dist is fragile under serverless bundling; keep it
      // out of the route's module graph so it can only fail PDF conversions.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      const { text } = await parser.getText();
      await parser.destroy();
      if (!text.trim()) throw new Error("no extractable text in PDF");
      const t = `[PDF] ${title}`;
      return { title: t, epub: await htmlToEpub(t, textToHtml(text)) };
    }
    default:
      throw new Error(`unsupported file type: .${ext || "?"}`);
  }
}
