import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Wypełnij wszystkie pola')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        // REJESTRACJA
        console.log('🔍 Sprawdzam czy użytkownik istnieje:', username)
        
        const { data: existing, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle()
        
        if (checkError) throw checkError
        
        if (existing) {
          throw new Error('Użytkownik już istnieje')
        }

        console.log('📝 Dodaję nowego użytkownika:', username)
        
        const { data, error } = await supabase
          .from('users')
          .insert([{ username, password }])
          .select()
          .single()
        
        if (error) throw error
        
        console.log('✅ Użytkownik dodany:', data)
        
        // ZAPISZ W localStorage
        const userData = { id: data.id, username: data.username }
        localStorage.setItem('fiszki_user', JSON.stringify(userData))
        console.log('💾 Zapisano w localStorage:', localStorage.getItem('fiszki_user'))
        
        // ZALOGUJ
        onLogin(userData)
      } else {
        // LOGOWANIE
        console.log('🔍 Szukam użytkownika:', username)
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle()
        
        if (error) throw error
        
        if (!data) {
          console.log('❌ Nie znaleziono użytkownika')
          throw new Error('Zła nazwa użytkownika lub hasło')
        }
        
        console.log('✅ Znaleziono użytkownika:', data)
        
        // ZAPISZ W localStorage
        const userData = { id: data.id, username: data.username }
        localStorage.setItem('fiszki_user', JSON.stringify(userData))
        console.log('💾 Zapisano w localStorage:', localStorage.getItem('fiszki_user'))
        
        // ZALOGUJ
        onLogin(userData)
      }
    } catch (error) {
      console.error('❌ Błąd:', error.message)
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
            type="text"
            placeholder="Nazwa użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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