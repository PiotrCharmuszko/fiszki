import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] }
          }
        })
        if (error) throw error
        alert('Sprawdź email aby potwierdzić rejestrację!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        onLogin(data.user)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-panel">
        <h2>{isRegister ? 'Rejestracja' : 'Logowanie'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" disabled={loading}>
            {loading ? '...' : isRegister ? 'Zarejestruj' : 'Zaloguj'}
          </button>
        </form>
        
        <button 
          className="switch-btn"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Masz konto? Zaloguj' : 'Nie masz konta? Zarejestruj'}
        </button>
      </div>
    </div>
  )
}