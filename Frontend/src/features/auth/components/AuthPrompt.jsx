import { useEffect, useState } from 'react'

const AuthPrompt = ({
    initialMode = 'login',
    loading,
    ready,
    error,
    onClose,
    onLogin,
    onRegister
}) => {
    const [mode, setMode] = useState(initialMode)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [loading, onClose])

    const submit = async (event) => {
        event.preventDefault()
        if (mode === 'login') {
            await onLogin({ email, password })
            return
        }
        await onRegister({ username, email, password })
    }

    const useDemoAccount = async () => {
        await onLogin({ email: 'recruiter@example.com', password: 'demo1234' })
    }

    return (
        <div
            className="auth-prompt-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) onClose()
            }}
        >
            <section
                className="auth-prompt"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-prompt-title"
            >
                <button
                    className="auth-prompt__close"
                    type="button"
                    onClick={onClose}
                    aria-label="Close sign-in dialog"
                    disabled={loading}
                >
                    ×
                </button>
                <span className="auth-prompt__eyebrow">Your interview plan starts here</span>
                <h2 id="auth-prompt-title">
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="auth-prompt__description">
                    Sign in or create an account to build and save your personalized interview strategy.
                </p>

                <div className="auth-prompt__tabs" role="tablist" aria-label="Account options">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={mode === 'login' ? 'is-active' : ''}
                        onClick={() => setMode('login')}
                    >
                        Log in
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'register'}
                        className={mode === 'register' ? 'is-active' : ''}
                        onClick={() => setMode('register')}
                    >
                        Register
                    </button>
                </div>

                <form className="auth-prompt__form" onSubmit={submit}>
                    {mode === 'register' && (
                        <label>
                            Username
                            <input
                                autoComplete="username"
                                required
                                minLength={2}
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Your name"
                            />
                        </label>
                    )}
                    <label>
                        Email
                        <input
                            autoComplete="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                        />
                    </label>
                    <label>
                        Password
                        <input
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="At least 6 characters"
                        />
                    </label>

                    {error && <p className="auth-prompt__error" role="alert">{error}</p>}
                    {!ready && <p className="auth-prompt__status">Checking your existing session…</p>}

                    <button className="auth-prompt__submit" type="submit" disabled={loading || !ready}>
                        {loading
                            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                            : (mode === 'login' ? 'Log in and continue' : 'Create account and continue')}
                    </button>
                </form>

                {mode === 'login' && (
                    <>
                        <div className="auth-prompt__separator"><span>or</span></div>
                        <button
                            className="auth-prompt__demo"
                            type="button"
                            onClick={useDemoAccount}
                            disabled={loading || !ready}
                        >
                            {loading ? 'Signing in…' : 'Continue with demo account'}
                        </button>
                    </>
                )}
            </section>
        </div>
    )
}

export default AuthPrompt
