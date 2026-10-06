import { useContext } from 'react'
import { AuthContext } from '../auth.context.js'
import { login, register, logout } from '../services/auth.api'

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    const {
        user,
        setUser,
        authReady,
        loading,
        setLoading,
        error,
        setError
    } = context

    const runAuthRequest = async (request) => {
        setLoading(true)
        setError('')

        try {
            const data = await request()

            if (!data?.user) {
                setError('The server did not return a user. Please try again.')
                return false
            }

            setUser(data.user)
            return true
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to connect to the server. Please try again.'
            )
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = ({ email, password }) =>
        runAuthRequest(() => login({ email, password }))

    const handleRegister = ({ username, email, password }) =>
        runAuthRequest(() => register({ username, email, password }))

    const handleLogout = async () => {
        setLoading(true)
        setError('')

        try {
            await logout()
            setUser(null)
            return true
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to log out. Please try again.'
            )
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        user,
        authReady,
        loading,
        error,
        handleRegister,
        handleLogin,
        handleLogout
    }
}
