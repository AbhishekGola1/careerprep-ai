import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import AuthPrompt from '../../auth/components/AuthPrompt'
import { useInterview } from '../hooks/useInterview.js'
import '../style/home.scss'

const MAX_RESUME_SIZE = 3 * 1024 * 1024

const Home = () => {
    const { user, authReady, loading: authLoading, error: authError, handleLogin, handleRegister, handleLogout } = useAuth()
    const { loading: generationLoading, generateReport, reports, getReports, clearReports } = useInterview()
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [resumeFile, setResumeFile] = useState(null)
    const [formError, setFormError] = useState('')
    const [authPromptMode, setAuthPromptMode] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            getReports()
        } else {
            clearReports()
        }
    }, [user, getReports, clearReports])

    const openAuthPrompt = (mode = 'login') => {
        setAuthPromptMode(mode)
    }

    const finishAuthentication = async (authenticate) => {
        const success = await authenticate()
        if (success) {
            setAuthPromptMode(null)
            setFormError('')
        }
        return success
    }

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0] ?? null
        setFormError('')

        if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setResumeFile(null)
            event.target.value = ''
            setFormError('Please upload your resume as a PDF file.')
            return
        }

        if (file && file.size > MAX_RESUME_SIZE) {
            setResumeFile(null)
            event.target.value = ''
            setFormError('The PDF must be smaller than 3 MB.')
            return
        }

        setResumeFile(file)
    }

    const handleGenerateReport = async () => {
        setFormError('')

        if (!user) {
            openAuthPrompt('login')
            return
        }

        if (!jobDescription.trim()) {
            setFormError('Add the job description to create a focused interview strategy.')
            return
        }

        if (!resumeFile && !selfDescription.trim()) {
            setFormError('Upload a PDF resume or add a short self-description.')
            return
        }

        try {
            const report = await generateReport({
                jobDescription: jobDescription.trim(),
                selfDescription: selfDescription.trim(),
                resumeFile
            })

            if (report?._id) {
                navigate(`/interview/${report._id}`)
            } else {
                setFormError('The server did not return a strategy. Please try again.')
            }
        } catch (error) {
            setFormError(
                error.response?.data?.message ||
                'We could not generate your strategy. Please try again in a moment.'
            )
        }
    }

    const handleLogoutClick = async () => {
        const loggedOut = await handleLogout()
        if (loggedOut) {
            clearReports()
        }
    }

    return (
        <div className="home-page">
            <nav className="home-topbar" aria-label="Main navigation">
                <button className="home-brand" type="button" onClick={() => navigate('/')}>
                    <span className="home-brand__mark" aria-hidden="true">CP</span>
                    <span>CareerPrep <strong>AI</strong></span>
                </button>
                <div className="home-topbar__actions">
                    {user ? (
                        <>
                            <span className="home-topbar__welcome">Hi, {user.username}</span>
                            <button
                                className="home-topbar__button home-topbar__button--quiet"
                                type="button"
                                onClick={handleLogoutClick}
                                disabled={authLoading}
                            >
                                {authLoading ? 'Please wait…' : 'Log out'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="home-topbar__button home-topbar__button--quiet"
                                type="button"
                                onClick={() => openAuthPrompt('login')}
                            >
                                Log in
                            </button>
                            <button
                                className="home-topbar__button"
                                type="button"
                                onClick={() => openAuthPrompt('register')}
                            >
                                Create account
                            </button>
                        </>
                    )}
                </div>
            </nav>

            <header className="page-header">
                <span className="page-header__eyebrow">Your next opportunity starts here</span>
                <h1>Walk into your next interview <span className="highlight">prepared.</span></h1>
                <p>Get a personalized interview strategy, role-specific questions, and a preparation roadmap built around your experience.</p>
            </header>

            <section className="interview-card" aria-labelledby="strategy-form-title">
                <div className="interview-card__intro">
                    <div>
                        <span className="interview-card__step">PERSONALIZED PREPARATION</span>
                        <h2 id="strategy-form-title">Build your interview strategy</h2>
                    </div>
                    {!user && <span className="interview-card__auth-note">Sign in to generate and save your plan</span>}
                </div>

                <div className="interview-card__body">
                    <section className="panel panel--left">
                        <div className="panel__header">
                            <span className="panel__icon" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h3>Target job description</h3>
                            <span className="badge badge--required">Required</span>
                        </div>
                        <textarea
                            value={jobDescription}
                            onChange={(event) => setJobDescription(event.target.value)}
                            onFocus={() => !user && openAuthPrompt('login')}
                            className="panel__textarea"
                            placeholder="Paste the job description here. Include the role, responsibilities, and skills the employer is looking for."
                            maxLength={5000}
                            readOnly={!user || generationLoading}
                            aria-label="Target job description"
                        />
                        <div className="char-counter">{jobDescription.length} / 5000 characters</div>
                    </section>

                    <div className="panel-divider" aria-hidden="true" />

                    <section className="panel panel--right">
                        <div className="panel__header">
                            <span className="panel__icon" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h3>Your experience</h3>
                        </div>

                        <div className="upload-section">
                            <label className="section-label" htmlFor="resume">Upload your resume <span className="badge badge--best">PDF · max 3 MB</span></label>
                            <label
                                className={`dropzone${resumeFile ? ' dropzone--selected' : ''}`}
                                htmlFor="resume"
                                onClick={(event) => {
                                    if (!user) {
                                        event.preventDefault()
                                        openAuthPrompt('login')
                                    }
                                }}
                            >
                                <span className="dropzone__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <span className="dropzone__title">{resumeFile ? resumeFile.name : 'Choose a PDF resume'}</span>
                                <span className="dropzone__subtitle">{resumeFile ? 'Click to choose a different file' : 'Your resume stays private to your account'}</span>
                                <input
                                    hidden
                                    type="file"
                                    id="resume"
                                    name="resume"
                                    accept=".pdf,application/pdf"
                                    disabled={!user || generationLoading}
                                    onChange={handleResumeChange}
                                />
                            </label>
                        </div>

                        <div className="or-divider"><span>or describe your background</span></div>

                        <div className="self-description">
                            <label className="section-label" htmlFor="selfDescription">Quick self-description</label>
                            <textarea
                                value={selfDescription}
                                onChange={(event) => setSelfDescription(event.target.value)}
                                onFocus={() => !user && openAuthPrompt('login')}
                                id="selfDescription"
                                name="selfDescription"
                                className="panel__textarea panel__textarea--short"
                                placeholder="Share your experience, key skills, and years in the field."
                                maxLength={3000}
                                readOnly={!user || generationLoading}
                            />
                        </div>

                        <div className="info-box">
                            <span className="info-box__icon" aria-hidden="true">i</span>
                            <p>Add a job description and either a <strong>PDF resume</strong> or a <strong>self-description</strong>.</p>
                        </div>
                    </section>
                </div>

                <div className="interview-card__footer">
                    <div className="interview-card__footer-copy">
                        <span className="footer-info">AI-powered strategy · usually ready in under a minute</span>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        className="generate-btn"
                        type="button"
                        disabled={generationLoading}
                    >
                        {generationLoading ? 'Creating your strategy…' : 'Generate my interview strategy'}
                        {!generationLoading && <span aria-hidden="true">→</span>}
                    </button>
                </div>
            </section>

            {user && reports.length > 0 && (
                <section className="recent-reports">
                    <h2>Your recent interview plans</h2>
                    <ul className="reports-list">
                        {reports.map((report) => (
                            <li key={report._id}>
                                <button
                                    type="button"
                                    className="report-item"
                                    onClick={() => navigate(`/interview/${report._id}`)}
                                >
                                    <h3>{report.title || 'Untitled position'}</h3>
                                    <p className="report-meta">Generated {new Date(report.createdAt).toLocaleDateString()}</p>
                                    <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                        Match score: {report.matchScore}%
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <footer className="page-footer">
                <span>CareerPrep AI · Prepare with confidence</span>
            </footer>

            {authPromptMode && (
                <AuthPrompt
                    initialMode={authPromptMode}
                    loading={authLoading}
                    ready={authReady}
                    error={authError}
                    onClose={() => setAuthPromptMode(null)}
                    onLogin={(credentials) => finishAuthentication(() => handleLogin(credentials))}
                    onRegister={(credentials) => finishAuthentication(() => handleRegister(credentials))}
                />
            )}
        </div>
    )
}

export default Home
