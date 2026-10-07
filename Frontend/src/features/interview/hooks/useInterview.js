import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useRef } from "react"
import { InterviewContext } from "../interview.context.js"


export const useInterview = () => {

    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context
    const reportsRequestId = useRef(0)

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response?.interviewReport ?? null)
            return response?.interviewReport ?? null
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReport])

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response?.interviewReport ?? null)
            return response?.interviewReport ?? null
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        const requestId = ++reportsRequestId.current
        setReports([])
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            const nextReports = response?.interviewReports ?? []
            if (requestId === reportsRequestId.current) {
                setReports(nextReports)
            }
            return nextReports
        } catch (error) {
            console.log(error)
            return []
        } finally {
            if (requestId === reportsRequestId.current) {
                setLoading(false)
            }
        }
    }, [setLoading, setReports])

    const clearReports = useCallback(() => {
        reportsRequestId.current += 1
        setReports([])
    }, [setReports])

    const getResumePdf = useCallback(async (interviewReportId) => {
        const response = await generateResumePdf({ interviewReportId })
        const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `resume_${interviewReportId}.pdf`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    }, [])

    return { loading, report, reports, generateReport, getReportById, getReports, clearReports, getResumePdf }

}