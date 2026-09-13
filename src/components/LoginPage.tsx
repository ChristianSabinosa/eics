import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    setIsAuthenticating(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError(error.message)
    }

    setIsAuthenticating(false)
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-mark">eICS</div>
          <div>
            <h1 id="login-title">Electronic Incident Command System</h1>
            <p>Incident Management &amp; Information System</p>
          </div>
        </div>

        <div className="login-heading">
          <p className="eyebrow">SECURE ACCESS</p>
          <h2>Sign in to eICS</h2>
          <p>Enter your credentials to access the dashboard.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {loginError && (
            <p className="login-error" role="alert">
              {loginError}
            </p>
          )}

          <button className="login-button" type="submit" disabled={isAuthenticating}>
            {isAuthenticating ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="login-footer">Electronic Incident Command System</p>
      </section>
    </main>
  )
}
