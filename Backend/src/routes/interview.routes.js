const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const interviewController = require('../controllers/interview.controller')
const upload = require('../middlewares/file.middleware')


const interviewRouter = express.Router();


/**
 * @route POST  /api/interview
 * @description generate new interview report on the basis of user self description, resume and job description
 * @access Private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)


/**
 * @route GET  /api/interview/
 * @description get all interview reports of logged in user.
 * @access Private
 */
interviewRouter.get("/report", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET  /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access Private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET  /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf on the basis of user self description, resume and job description
 * @access Private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)


module.exports = interviewRouter