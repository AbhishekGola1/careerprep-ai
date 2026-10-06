const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');
const puppeteer = require('puppeteer');

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

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        return await page.pdf({ format: 'A4', printBackground: true });
    } finally {
        await browser.close();
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe('The HTML content of the resume which can be converted to PDF using Puppeteer')
    });

    const prompt = `Generate a resume for a candidate with the following details:
        Resume: ${resume || 'Not provided'}
        Self Description: ${selfDescription || 'Not provided'}
        Job Description: ${jobDescription || 'Not provided'}

        Return a JSON object with a single field "html" that contains the full HTML content of a polished, ATS-friendly resume tailored for the given job description.
    `;

    const response = await generateContentWithFallback(prompt, resumePdfSchema);

    const jsonContent = JSON.parse(response.text);
    return await generatePdfFromHtml(jsonContent.html);
}

module.exports = { generateInterviewReport, generateResumePdf };