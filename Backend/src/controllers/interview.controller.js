const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
const { generateInterviewReport, generateResumePdf } = require('../services/ai.service');
const interviewReportModel = require('../models/interviewReport.model');

/**
 * @description Controller to generate interview report based on user self description, resume and job description
 */
async function generateInterviewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body;

        if (!jobDescription?.trim()) {
            return res.status(400).json({ message: 'Job description is required' });
        }

        if (!req.file && !selfDescription?.trim()) {
            return res.status(400).json({ message: 'Job description and either resume or self description are required' });
        }

        let resumeText = '';
        if (req.file) {
            if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
                return res.status(400).json({ message: 'The uploaded file is not a valid PDF' });
            }

            const parser = new PDFParse({ data: req.file.buffer });
            try {
                const parsedPdf = await parser.getText();
                resumeText = parsedPdf.text || '';
            } finally {
                await parser.destroy();
            }
        }

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription?.trim() || '',
            jobDescription: jobDescription.trim()
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription?.trim() || '',
            jobDescription: jobDescription.trim(),
            ...interviewReportByAi
        });

        return res.status(201).json({
            message: 'Interview report generated successfully',
            interviewReport
        });
    } catch (error) {
        console.error('generateInterviewReportController error:', error);
        if (error.statusCode === 503) {
            return res.status(503).json({
                message: 'The AI service is temporarily overloaded. Please wait a minute and try again.'
            });
        }
        return res.status(500).json({ message: 'Failed to generate interview report' });
    }
}

/**
 * @description Controller to get interview report by interviewId
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
        return res.status(404).json({ message: 'Interview report not found' });
    }

    return res.status(200).json({
        message: 'Interview report fetched successfully',
        interviewReport
    });
}

/**
 * @description Controller to get all interview reports of logged in user
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select('-resume -selfDescription -jobDescription -__v');

    return res.status(200).json({
        message: 'Interview reports fetched successfully.',
        interviewReports
    });
}

/**
 * @description Controller to generate resume pdf based on user self description, resume and job description
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params;

    if (!mongoose.isValidObjectId(interviewReportId)) {
        return res.status(400).json({ message: 'Invalid interview report ID' });
    }

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({ message: 'Interview report not found' });
        }

        const { resume, selfDescription, jobDescription, title } = interviewReport;

        const pdfBuffer = await generateResumePdf({ resume, selfDescription, jobDescription, title });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="resume_${interviewReportId}.pdf"`
        });

        return res.send(pdfBuffer);
    } catch (error) {
        console.error('generateResumePdfController error:', error);
        return res.status(500).json({ message: 'Resume PDF generation failed. Please try again.' });
    }
}

module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController };