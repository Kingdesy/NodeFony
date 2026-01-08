import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    // Le proxy configuré dans vite.config.ts redirigera vers http://localhost:8000/api/user
    axios.get('/api/user')
      .then(response => {
        setUsers(response.data)
      })
      .catch(error => console.error("Erreur API:", error))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Liste des Utilisateurs (NodeFony + React)</h1>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>{user.name} - {user.email || 'Utilisateur ' + user.id}</li>
          
        ))}
      </ul>
      {users.length === 0 && <p>Aucun utilisateur trouvé ou chargement...</p>}
    </div>
  )
}

export default App