import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { JoinPage } from './pages/Join/JoinPage'
import { SolvePage } from './pages/Solve/SolvePage'
import { AuthPage } from './pages/Auth/AuthPage'
import { TeacherPage } from './pages/Teacher/TeacherPage'
import { clearStudent, getStudent } from './lib/session'
import { auth } from './lib/auth'

function StudentHome() {
  const navigate = useNavigate()
  const [studentCode, setStudentCode] = useState<string | null>(() => getStudent())

  useEffect(() => {
    const session = auth.getSession()
    if (!session) {
      navigate('/login')
    } else if (session.role === 'teacher') {
      navigate('/teacher')
    }
  }, [navigate])

  if (!studentCode) return <JoinPage onJoined={setStudentCode} />
  return (
    <SolvePage
      studentCode={studentCode}
      onLeave={() => {
        clearStudent()
        setStudentCode(null)
      }}
    />
  )
}

function ProtectedTeacherRoute() {
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const session = auth.getSession()
    if (!session || session.role !== 'teacher') {
      setAuthorized(false)
      navigate('/login')
    } else {
      setAuthorized(true)
    }
  }, [navigate])

  if (authorized === null) {
    return <div className="p-12 text-center text-slate-400">Verifying teacher authorization...</div>
  }

  return <TeacherPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<StudentHome />} />
        <Route path="/teacher" element={<ProtectedTeacherRoute />} />
        <Route path="/teacher/*" element={<ProtectedTeacherRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
