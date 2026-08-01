import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import '../auth.form.scss'
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const demoCredentials = {
        email: 'recruiter@example.com',
        password: 'demo1234'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await handleLogin({ email, password })
        if (success) {
            navigate('/')
        }
    }

    const handleDemoLogin = async () => {
        const success = await handleLogin(demoCredentials)
        if (success) {
            navigate('/')
        }
    }

    if (loading) {
        return (<main> <h1>Loading.......</h1> </main>)
    }


  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>

                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        onChange={(e) => { setEmail(e.target.value); }}
                        type="email" id="email" name='email' placeholder='Enter email address' />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        onChange={(e) => { setPassword(e.target.value); }} 
                        type="password" id="password" name='password' placeholder='Enter password' />
                </div>

                <button className='button primary-button' type='submit'>Login</button>

                <button className='button secondary-button' type='button' onClick={handleDemoLogin}>
                    Demo User 
                </button>

            </form>

            <p>Don't have an account? <Link to={"/register"}>Register</Link> </p>
        </div>
    </main>
  )
}


export default Login