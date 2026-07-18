// Generates public/templates/jd-template.docx — the downloadable JD template
// linked from the job form's "JD file upload" field. Run manually when the
// template content needs to change: `node scripts/generate-jd-template.mjs`.
import { writeFileSync, mkdirSync } from "node:fs";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } });
}

function hint(text) {
  return new Paragraph({ children: [new TextRun({ text, italics: true, color: "6B7280" })], spacing: { after: 200 } });
}

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ text: "Job Description Template", heading: HeadingLevel.TITLE }),
        hint("Fill in each section below, then upload this file back into Krrrja to auto-fill the job form."),

        heading("Job Title"),
        hint("e.g. Senior Backend Engineer"),
        new Paragraph({ text: "" }),

        heading("Job Type"),
        hint("One of: Full-time, Part-time, Contract, Temporary, Internship"),
        new Paragraph({ text: "" }),

        heading("Workplace"),
        hint("One of: On-site, Hybrid, Remote"),
        new Paragraph({ text: "" }),

        heading("Salary Range"),
        hint("e.g. USD 60000 - 90000/yr. Leave blank if not disclosed."),
        new Paragraph({ text: "" }),

        heading("Job Description"),
        hint("Responsibilities, team, what success looks like."),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        heading("Requirements"),
        hint("Must-have qualifications, education, experience level."),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        heading("Skills"),
        hint("Comma-separated, e.g. Node.js, PostgreSQL, AWS"),
        new Paragraph({ text: "" }),

        heading("Screening Criteria"),
        hint("Free text — treated as the primary constraint when AI scores CVs, e.g. \"5+ yrs Node.js, distributed systems experience, startup background preferred\"."),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
      ],
    },
  ],
});

mkdirSync("public/templates", { recursive: true });
const buffer = await Packer.toBuffer(doc);
writeFileSync("public/templates/jd-template.docx", buffer);
console.log("Wrote public/templates/jd-template.docx");
