// Generates demo CV PDFs for exercising the screening pipeline end-to-end.
// Real embedded text layer (PostScript -> ps2pdf), so pdf-parse reads them
// without the OCR fallback. Fictional people; safe to commit and demo.
//
// Run: node scripts/generate-cv-fixtures.mjs   (needs ghostscript's ps2pdf)
// Output: fixtures/cvs/*.pdf
//
// The set is tuned against the brief's example criteria ("min 3 years backend,
// has handled systems with 10k+ users") to produce a visible score spread:
// strong / solid / borderline / weak / red-flag-heavy.

import { execFile } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const OUT_DIR = path.join(process.cwd(), "fixtures", "cvs");

// ── PostScript emitter ───────────────────────────────────────────────────

const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const TOP_Y = 736;
const BOTTOM_Y = 56;
const LINE_H = 13.5;
const MAX_CHARS = 92; // ~fits the text column at 10pt Helvetica

// PostScript string literals: \, ( and ) must be escaped.
const esc = (s) => s.replace(/([\\()])/g, "\\$1");

function wrap(text, width = MAX_CHARS) {
  const out = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line === "") line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line !== "") out.push(line);
  return out;
}

// Blocks: {h1|h2|body|bullet|space}. Emitted top-down with automatic paging.
function toPostScript(blocks) {
  const ps = ["%!PS-Adobe-3.0", "%%Pages: (atend)", "%%EndComments"];
  let y = TOP_Y;
  let pages = 1;
  ps.push("%%Page: 1 1");

  const newPageIfNeeded = (needed) => {
    if (y - needed >= BOTTOM_Y) return;
    ps.push("showpage");
    pages += 1;
    ps.push(`%%Page: ${pages} ${pages}`);
    y = TOP_Y;
  };

  const emit = (font, size, text, indent = 0) => {
    newPageIfNeeded(size + 2);
    ps.push(`/${font} findfont ${size} scalefont setfont`);
    ps.push(`${MARGIN_X + indent} ${y.toFixed(1)} moveto`);
    ps.push(`(${esc(text)}) show`);
    y -= size <= 10 ? LINE_H : size + 5;
  };

  for (const block of blocks) {
    switch (block.t) {
      case "h1":
        emit("Helvetica-Bold", 18, block.text);
        y -= 2;
        break;
      case "h2":
        y -= 6;
        newPageIfNeeded(30);
        emit("Helvetica-Bold", 11.5, block.text.toUpperCase());
        // Rule under the section heading.
        ps.push(`${MARGIN_X} ${(y + 6).toFixed(1)} moveto ${MARGIN_X + 483} ${(y + 6).toFixed(1)} lineto 0.6 setlinewidth stroke`);
        y -= 4;
        break;
      case "body":
        for (const line of wrap(block.text)) emit("Helvetica", 10, line);
        break;
      case "bullet":
        for (const [i, line] of wrap(block.text, MAX_CHARS - 4).entries()) {
          emit("Helvetica", 10, i === 0 ? `• ${line}` : `  ${line}`, 8);
        }
        break;
      case "space":
        y -= LINE_H * (block.n ?? 1);
        break;
      default:
        throw new Error(`Unknown block type "${block.t}"`);
    }
  }

  ps.push("showpage", `%%Pages: ${pages}`, "%%EOF");
  return ps.join("\n");
}

// ── Fixture CVs ──────────────────────────────────────────────────────────
// All fictional. Contact details use example.com / reserved-range numbers.

const CVS = [
  {
    file: "sarah-chen-backend-engineer.pdf",
    note: "strong fit — 6y backend, explicit 10k+ scale, criteria met head-on",
    blocks: [
      { t: "h1", text: "Sarah Chen" },
      { t: "body", text: "Senior Backend Engineer  |  Jakarta, Indonesia" },
      { t: "body", text: "sarah.chen@example.com  |  +62 811 5550 0142  |  github.com/example-schen" },
      { t: "h2", text: "Summary" },
      { t: "body", text: "Backend engineer with 6 years building and operating high-traffic APIs. Owned services handling 50,000+ daily active users at peak. Focused on Node.js, Go, and Postgres, with deep experience in queueing, caching, and observability." },
      { t: "h2", text: "Experience" },
      { t: "body", text: "Senior Backend Engineer — Tokopedia-scale marketplace (fictional co.), 2023 - Present" },
      { t: "bullet", text: "Own the order-processing service handling 50,000+ daily active users and ~2M requests/day; cut p95 latency from 840ms to 210ms by adding Redis read-through caching and fixing N+1 queries." },
      { t: "bullet", text: "Designed an idempotent, DB-backed job queue processing 400k jobs/day; brought failed-job rate from 3.1% to 0.2% with bounded retries and dead-letter handling." },
      { t: "bullet", text: "Led migration from a single Postgres instance to primary + 2 read replicas with zero downtime." },
      { t: "bullet", text: "Mentor 4 engineers; run the on-call rotation and postmortem process." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Backend Engineer — Fintech payments startup (fictional co.), 2020 - 2023" },
      { t: "bullet", text: "Built the payments reconciliation pipeline serving 15,000+ monthly active merchants; processed ~IDR 40B/month in transaction volume." },
      { t: "bullet", text: "Introduced structured logging and tracing; reduced mean time to diagnose incidents from ~45min to ~8min." },
      { t: "bullet", text: "Wrote the Stripe and Midtrans webhook handlers, including signature verification and event-id idempotency." },
      { t: "h2", text: "Skills" },
      { t: "body", text: "Languages: Go, TypeScript/Node.js, Python, SQL" },
      { t: "body", text: "Data: PostgreSQL, Redis, ClickHouse, Kafka" },
      { t: "body", text: "Infra: Docker, Kubernetes, Terraform, AWS (ECS, RDS, S3), GitHub Actions" },
      { t: "h2", text: "Education" },
      { t: "body", text: "B.Sc. Computer Science — Universitas Indonesia, 2020" },
    ],
  },
  {
    file: "budi-santoso-backend-engineer.pdf",
    note: "solid fit — 4y backend, 12k users, meets bar but thinner than Chen",
    blocks: [
      { t: "h1", text: "Budi Santoso" },
      { t: "body", text: "Backend Engineer  |  Bandung, Indonesia" },
      { t: "body", text: "budi.santoso@example.com  |  +62 812 5550 0733  |  linkedin.com/in/example-bsantoso" },
      { t: "h2", text: "Summary" },
      { t: "body", text: "Backend engineer with 4 years of experience shipping REST APIs in Node.js and Java. Comfortable owning a service end to end, from schema design through deployment and on-call." },
      { t: "h2", text: "Experience" },
      { t: "body", text: "Backend Engineer — Logistics SaaS (fictional co.), 2022 - Present" },
      { t: "bullet", text: "Maintain the shipment-tracking API used by roughly 12,000 registered users across 30 client companies." },
      { t: "bullet", text: "Added Redis caching to the tracking lookup endpoint, cutting average response time from 600ms to 180ms." },
      { t: "bullet", text: "Migrated background jobs from cron scripts to a BullMQ queue, which removed a recurring class of duplicate-send bugs." },
      { t: "bullet", text: "Participate in weekly on-call; handled 2 production incidents as primary responder." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Junior Backend Engineer — Digital agency (fictional co.), 2021 - 2022" },
      { t: "bullet", text: "Built CRUD APIs and admin dashboards for 6 client projects using Express and MySQL." },
      { t: "bullet", text: "Wrote integration tests that took the main project's coverage from 20% to 65%." },
      { t: "h2", text: "Skills" },
      { t: "body", text: "Languages: JavaScript/Node.js, Java, SQL" },
      { t: "body", text: "Data: PostgreSQL, MySQL, Redis" },
      { t: "body", text: "Infra: Docker, GitLab CI, DigitalOcean" },
      { t: "h2", text: "Education" },
      { t: "body", text: "B.Sc. Informatics — Institut Teknologi Bandung, 2021" },
    ],
  },
  {
    file: "maya-putri-backend-engineer.pdf",
    note: "borderline — 2y backend (under the 3y bar), no scale evidence",
    blocks: [
      { t: "h1", text: "Maya Putri" },
      { t: "body", text: "Backend Developer  |  Yogyakarta, Indonesia" },
      { t: "body", text: "maya.putri@example.com  |  +62 813 5550 0219" },
      { t: "h2", text: "Summary" },
      { t: "body", text: "Backend developer with 2 years of professional experience. Strong in Python and Django, keen to work on larger systems." },
      { t: "h2", text: "Experience" },
      { t: "body", text: "Backend Developer — Internal tools team (fictional co.), 2024 - Present" },
      { t: "bullet", text: "Build and maintain Django services for the company's internal HR and inventory tools." },
      { t: "bullet", text: "Wrote a reporting export feature used weekly by the finance team." },
      { t: "bullet", text: "Improved a slow report query by adding the right indexes." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Backend Developer (Contract) — Local e-commerce shop (fictional co.), 2023 - 2024" },
      { t: "bullet", text: "Implemented the product catalog and cart API for a small online store." },
      { t: "bullet", text: "Integrated a local payment gateway." },
      { t: "h2", text: "Projects" },
      { t: "bullet", text: "Personal blog engine in FastAPI with a Postgres backend; deployed on a single VPS." },
      { t: "h2", text: "Skills" },
      { t: "body", text: "Languages: Python, SQL, some JavaScript" },
      { t: "body", text: "Frameworks: Django, FastAPI, Flask" },
      { t: "body", text: "Data: PostgreSQL, SQLite" },
      { t: "h2", text: "Education" },
      { t: "body", text: "B.Sc. Information Systems — Universitas Gadjah Mada, 2023" },
    ],
  },
  {
    file: "andi-wijaya-frontend-engineer.pdf",
    note: "weak fit — frontend career, no backend depth; should rank low, not error",
    blocks: [
      { t: "h1", text: "Andi Wijaya" },
      { t: "body", text: "Frontend Engineer  |  Surabaya, Indonesia" },
      { t: "body", text: "andi.wijaya@example.com  |  +62 814 5550 0688  |  example-awijaya.dev" },
      { t: "h2", text: "Summary" },
      { t: "body", text: "Frontend engineer with 5 years building React interfaces and design systems. Interested in moving toward full-stack work." },
      { t: "h2", text: "Experience" },
      { t: "body", text: "Senior Frontend Engineer — B2B SaaS (fictional co.), 2022 - Present" },
      { t: "bullet", text: "Own the component library used across 4 product surfaces; ~120 components, documented in Storybook." },
      { t: "bullet", text: "Cut the main bundle from 1.2MB to 380KB via code splitting and dependency pruning; Lighthouse performance 62 to 94." },
      { t: "bullet", text: "Drove the accessibility audit to WCAG 2.1 AA across the checkout flow." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Frontend Engineer — Media company (fictional co.), 2020 - 2022" },
      { t: "bullet", text: "Built the article reader and paywall UI for a news site with a large monthly readership." },
      { t: "bullet", text: "Consumed backend REST APIs; occasionally patched small Node.js BFF endpoints when the backend team was blocked." },
      { t: "h2", text: "Skills" },
      { t: "body", text: "Languages: TypeScript, JavaScript, HTML, CSS" },
      { t: "body", text: "Frameworks: React, Next.js, Vue, Tailwind" },
      { t: "body", text: "Other: Figma, Storybook, Playwright, Vercel" },
      { t: "h2", text: "Education" },
      { t: "body", text: "B.Sc. Computer Science — Universitas Airlangga, 2020" },
    ],
  },
  {
    file: "rian-kusuma-backend-engineer.pdf",
    note: "red-flag material — vague claims, unexplained gap, short stints; tests red_flags[]",
    blocks: [
      { t: "h1", text: "Rian Kusuma" },
      { t: "body", text: "Backend Engineer  |  Remote" },
      { t: "body", text: "rian.kusuma@example.com" },
      { t: "h2", text: "Summary" },
      { t: "body", text: "Passionate backend engineer. Fast learner. Team player. Have worked with many technologies and always deliver results on time." },
      { t: "h2", text: "Experience" },
      { t: "body", text: "Backend Engineer — Startup (fictional co.), Jan 2025 - Jun 2025" },
      { t: "bullet", text: "Worked on backend services." },
      { t: "bullet", text: "Used Node.js and MongoDB." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Backend Engineer — Startup (fictional co.), Mar 2024 - Sep 2024" },
      { t: "bullet", text: "Responsible for API development and bug fixing." },
      { t: "bullet", text: "Handled a system with a huge number of users." },
      { t: "space", n: 0.5 },
      { t: "body", text: "Freelance Developer, 2021 - 2022" },
      { t: "bullet", text: "Various web projects for various clients." },
      { t: "h2", text: "Skills" },
      { t: "body", text: "Node.js, Python, Java, Go, Rust, PHP, Ruby, C++, React, Angular, Vue, Kubernetes, AWS, GCP, Azure, TensorFlow, blockchain" },
      { t: "h2", text: "Education" },
      { t: "body", text: "Bootcamp certificate — Full Stack Web Development, 2021" },
    ],
  },
];

// ── Build ────────────────────────────────────────────────────────────────

async function main() {
  // ps2pdf has no version flag of its own — probe the ghostscript it wraps.
  try {
    await run("gs", ["--version"]);
  } catch {
    console.error("ghostscript not found (ps2pdf needs it). Install it, e.g. `sudo apt install ghostscript`.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  for (const cv of CVS) {
    const psPath = path.join(OUT_DIR, cv.file.replace(/\.pdf$/, ".ps"));
    const pdfPath = path.join(OUT_DIR, cv.file);
    await writeFile(psPath, toPostScript(cv.blocks), "utf8");
    await run("ps2pdf", ["-dPDFSETTINGS=/prepress", psPath, pdfPath]);
    await rm(psPath);
    console.log(`  ${cv.file}  —  ${cv.note}`);
  }

  console.log(`\n${CVS.length} CV PDFs written to fixtures/cvs/`);
}

await main();
