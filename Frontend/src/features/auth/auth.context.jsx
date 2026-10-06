import { useEffect, useState } from 'react'
import { getMe } from './services/auth.api'
import { AuthContext } from './auth.context.js'

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [authReady, setAuthReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        getMe()
            .then((data) => {
                if (isMounted) {
                    setUser((currentUser) => currentUser ?? data?.user ?? null)
                }
            })
            .finally(() => {
                if (isMounted) {
                    setAuthReady(true)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            authReady,
            loading,
            setLoading,
            error,
            setError
        }}>
            {children}
        </AuthContext.Provider>
    )
}
