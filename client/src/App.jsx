// client/src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Chat from './pages/Chat.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Chat />} />
      <Route path="/chat/:id" element={<Chat />} />
    </Routes>
  )
}