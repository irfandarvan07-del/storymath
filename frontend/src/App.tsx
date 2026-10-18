import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { JoinPage } from './pages/Join/JoinPage'
import { SolvePage } from './pages/Solve/SolvePage'
import { clearStudent, getStudent } from './lib/session'

import { TeacherPage } from './pages/Teacher/TeacherPage'

function StudentHome() {
  const [studentCode, setStudentCode] = useState<string | null>(() => getStudent())

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/teacher/*" element={<TeacherPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
