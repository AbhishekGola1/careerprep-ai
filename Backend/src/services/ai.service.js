const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');
const PDFDocument = require('pdfkit');

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const primaryModel = process.env.GOOGLE_GENAI_MODEL || 'gemini-2.5-flash-lite';
const fallbackModel = process.env.GOOGLE_GENAI_FALLBACK_MODEL || 'gemini-2.5-flash';

function getApiErrorCode(error) {
    const candidates = [
        error?.code,
        error?.status,
        error?.error?.code,
        error?.error?.status
    ];

    for (const candidate of candidates) {
        const numericCode = Number(candidate);
        if (Number.isInteger(numericCode)) {
            return numericCode;
        }
    }

    const message = String(error?.message || '');
    const embeddedCode = message.match(/"code"\s*:\s*(\d{3})/);
    return embeddedCode ? Number(embeddedCode[1]) : null;
}

function isTemporaryModelFailure(error) {
    const code = getApiErrorCode(error);
    return code === 429 || code === 500 || code === 502 || code === 503 || code === 504;
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function toGeminiResponseSchema(zodSchema) {
    const jsonSchema = z.toJSONSchema(zodSchema);

    const removeUnsupportedFields = (value) => {
        if (Array.isArray(value)) {
            return value.map(removeUnsupportedFields);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value)
                    .filter(([key]) => key !== '$schema' && key !== 'additionalProperties')
                    .map(([key, child]) => [key, removeUnsupportedFields(child)])
            );
        }

        return value;
    };

    return removeUnsupportedFields(jsonSchema);
}

async function generateContentWithFallback(contents, responseSchema) {
    const models = [...new Set([primaryModel, fallbackModel])];
    let lastError;
    let retryNumber = 0;
    const geminiResponseSchema = toGeminiResponseSchema(responseSchema);

    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                return await ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: geminiResponseSchema
                    }
                });
            } catch (error) {
                lastError = error;

                if (!isTemporaryModelFailure(error)) {
                    throw error;
                }

                const code = getApiErrorCode(error);
                console.warn(
                    `Gemini model ${model} returned temporary HTTP ${code || '5xx'} ` +
                    `(attempt ${attempt + 1}/2).`
                );

                const isLastAttempt = model === models[models.length - 1] && attempt === 1;
                if (!isLastAttempt) {
                    const backoff = Math.min(1000 * (2 ** retryNumber), 4000);
                    const jitter = Math.floor(Math.random() * 300);
                    await wait(backoff + jitter);
                    retryNumber += 1;
                }
            }
        }
    }

    const unavailableError = new Error('Gemini is temporarily unavailable after retries');
    unavailableError.statusCode = 503;
    unavailableError.cause = lastError;
    throw unavailableError;
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe('The technical question that can be asked in the interview'),
        intention: z.string().describe('The intention of the interviewer behind asking this question'),
        answer: z.string().describe('How to answer this question, what points to cover, and what approach to take')
    })).describe('Technical questions that can be asked in the interview along with their intention and how to answer them'),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe('The behavioral question that can be asked in the interview'),
        intention: z.string().describe('The intention of the interviewer behind asking this question'),
        answer: z.string().describe('How to answer this question, what points to cover, and what approach to take')
    })).describe('Behavioral questions that can be asked in the interview along with their intention and how to answer them'),
    skillGaps: z.array(z.object({
        skill: z.string().describe('The skill which the candidate is lacking'),
        severity: z.enum(['low', 'medium', 'high']).describe('The severity of this skill gap')
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe('The day number in the preparation plan, starting from 1'),
        focus: z.string().describe('The main focus of this day in the preparation plan'),
        tasks: z.array(z.string()).describe('List of tasks to be done on this day')
    })).describe('A day-wise preparation plan for the candidate'),
    title: z.string().describe('The title of the job for which the interview report is generated')
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error('GOOGLE_GENAI_API_KEY is not configured');
    }

    const prompt = `Generate an interview report for a candidate with the following details:
        Resume: ${resume || 'Not provided'}
        Self Description: ${selfDescription || 'Not provided'}
        Job Description: ${jobDescription || 'Not provided'}
    `;

    const response = await generateContentWithFallback(prompt, interviewReportSchema);

    return JSON.parse(response.text);
}

const resumeSectionNames = new Map([
    ['summary', 'PROFESSIONAL SUMMARY'],
    ['professional summary', 'PROFESSIONAL SUMMARY'],
    ['career summary', 'PROFESSIONAL SUMMARY'],
    ['objective', 'PROFESSIONAL SUMMARY'],
    ['career objective', 'PROFESSIONAL SUMMARY'],
    ['profile', 'PROFESSIONAL SUMMARY'],
    ['skills', 'SKILLS'],
    ['technical skills', 'SKILLS'],
    ['core competencies', 'SKILLS'],
    ['key skills', 'SKILLS'],
    ['work experience', 'EXPERIENCE'],
    ['professional experience', 'EXPERIENCE'],
    ['experience', 'EXPERIENCE'],
    ['work history', 'EXPERIENCE'],
    ['employment history', 'EXPERIENCE'],
    ['internships', 'EXPERIENCE'],
    ['projects', 'PROJECTS'],
    ['personal projects', 'PROJECTS'],
    ['academic projects', 'PROJECTS'],
    ['education', 'EDUCATION'],
    ['academic background', 'EDUCATION'],
    ['certifications', 'CERTIFICATIONS'],
    ['certificates', 'CERTIFICATIONS'],
    ['achievements', 'ACHIEVEMENTS'],
    ['awards', 'ACHIEVEMENTS'],
    ['strengths', 'ADDITIONAL INFORMATION'],
    ['additional information', 'ADDITIONAL INFORMATION'],
    ['languages', 'ADDITIONAL INFORMATION'],
    ['volunteer experience', 'VOLUNTEER EXPERIENCE']
]);

function normalizeResumeLine(line) {
    return line
        .replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/gi, '$1')
        .replace(/^\s*(?:[-*•▪◦]|\d+[.)])\s*/, '• ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseResumeSections(resume, selfDescription) {
    const lines = (resume || selfDescription || '')
        .split(/\r?\n/)
        .map(normalizeResumeLine)
        .filter(Boolean);
    const headerLines = [];
    const sections = [];
    let currentSection;
    let foundSection = false;

    for (const line of lines) {
        const normalizedHeading = line.toLowerCase().replace(/[:\s]+$/, '');
        const sectionName = resumeSectionNames.get(normalizedHeading);
        if (sectionName) {
            foundSection = true;
            currentSection = sections.find((section) => section.name === sectionName);
            if (!currentSection) {
                currentSection = { name: sectionName, entries: [] };
                sections.push(currentSection);
            }
            continue;
        }

        if (!foundSection) {
            headerLines.push(line);
        } else {
            currentSection.entries.push(line);
        }
    }

    const isContactLine = (line) =>
        /@|(?:\+?\d[\d\s().-]{7,})|linkedin|github|portfolio|https?:\/\/|location\s*:/i.test(line);
    const nameIndex = headerLines.findIndex((line) =>
        !isContactLine(line) && line.length <= 70 && !/[.!?]$/.test(line)
    );
    const name = nameIndex === -1 ? '' : headerLines[nameIndex];
    const contact = headerLines.filter((line, index) => index !== nameIndex && isContactLine(line));
    const preface = headerLines.filter((line, index) =>
        index !== nameIndex && !isContactLine(line)
    );

    if (preface.length) {
        sections.unshift({ name: 'PROFESSIONAL SUMMARY', entries: preface });
    } else if (!sections.length && lines.length && !name && !contact.length) {
        sections.push({ name: 'PROFESSIONAL SUMMARY', entries: lines });
    }

    if (!sections.some((section) => section.name === 'PROFESSIONAL SUMMARY') && selfDescription) {
        sections.unshift({
            name: 'PROFESSIONAL SUMMARY',
            entries: selfDescription.split(/\r?\n/).map(normalizeResumeLine).filter(Boolean)
        });
    }

    return { name, contact, sections };
}

function generateResumePdf({ resume, selfDescription, jobDescription, title }) {
    const { name, contact, sections } = parseResumeSections(resume, selfDescription);
    const document = new PDFDocument({ size: 'A4', margins: { top: 34, right: 38, bottom: 34, left: 38 } });
    const chunks = [];
    document.info.Title = `${name || 'Professional'} - ATS Resume`;
    document.info.Author = name || 'CareerPrep AI';

    return new Promise((resolve, reject) => {
        document.on('data', (chunk) => chunks.push(chunk));
        document.on('end', () => resolve(Buffer.concat(chunks)));
        document.on('error', reject);

        const left = document.page.margins.left;
        const width = document.page.width - left - document.page.margins.right;
        const bottom = document.page.height - document.page.margins.bottom;
        const layout = {
            y: document.page.margins.top,
            bodyFont: 9,
            bodyLineGap: 1.5,
            sectionFont: 10,
            sectionGap: 7
        };

        const drawText = (text, font, fontSize, options = {}) => {
            document.font(font).fontSize(fontSize);
            const height = document.heightOfString(text, {
                width,
                lineGap: options.lineGap || 0,
                indent: options.indent || 0
            });
            if (layout.y + height > bottom) {
                return false;
            }
            document.fillColor(options.color || '#222222').text(text, left, layout.y, {
                width,
                lineGap: options.lineGap || 0,
                indent: options.indent || 0
            });
            layout.y += height + (options.after || 0);
            return true;
        };

        const drawContact = () => {
            const rows = [];
            let currentRow = '';
            document.font('Helvetica').fontSize(8.5);
            for (const item of contact) {
                const candidate = currentRow ? `${currentRow}  |  ${item}` : item;
                if (currentRow && document.widthOfString(candidate) > width) {
                    rows.push(currentRow);
                    currentRow = item;
                } else {
                    currentRow = candidate;
                }
            }
            if (currentRow) {
                rows.push(currentRow);
            }
            for (const row of rows) {
                if (!drawText(row, 'Helvetica', 8.5, { color: '#444444', after: 1 })) {
                    return false;
                }
            }
            layout.y += 3;
            return true;
        };

        const drawEntry = (entry, sectionName) => {
            const looksLikeProjectDescription =
                /^(?:built|created|developed|designed|implemented|integrated|led|managed|improved|automated|deployed|delivered|engineered|maintained|optimized|reduced|increased|launched|used|worked|collaborated|contributed|responsible)\b/i
                    .test(entry);
            if (sectionName === 'PROJECTS' && !entry.startsWith('•') &&
                entry.length <= 65 && entry.split(/\s+/).length <= 9 &&
                !looksLikeProjectDescription && !/:/.test(entry) && !/[.!?]$/.test(entry)) {
                return drawText(entry, 'Helvetica-Bold', layout.bodyFont, {
                    color: '#222222',
                    after: 1
                });
            }

            if (sectionName === 'PROJECTS' && !entry.startsWith('•')) {
                entry = `• ${entry}`;
            }

            const isBullet = entry.startsWith('•');
            return drawText(entry, 'Helvetica', layout.bodyFont, {
                lineGap: layout.bodyLineGap,
                indent: isBullet ? 10 : 0,
                after: 2
            });
        };

        drawText(name || 'PROFESSIONAL RESUME', 'Helvetica-Bold', 18, {
            color: '#17365d',
            after: 2
        });
        if (title) {
            drawText(title, 'Helvetica-Bold', 10, { color: '#333333', after: 3 });
        }
        if (contact.length) {
            drawContact();
        }

        for (const section of sections) {
            if (!section.entries.length) {
                continue;
            }

            layout.y += layout.sectionGap;
            if (!drawText(section.name, 'Helvetica-Bold', layout.sectionFont, {
                color: '#17365d',
                after: 2
            })) {
                break;
            }
            document.save()
                .moveTo(left, layout.y)
                .lineTo(left + width, layout.y)
                .lineWidth(0.5)
                .strokeColor('#aab4c0')
                .stroke()
                .restore();
            layout.y += 4;
            for (const entry of section.entries) {
                if (!drawEntry(entry, section.name)) {
                    break;
                }
            }
        }

        document.end();
    });
}

module.exports = { generateInterviewReport, generateResumePdf };