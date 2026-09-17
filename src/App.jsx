import { Route, Routes } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import RegisterPage from './pages/RegisterPage'
import SuccessPage from './pages/SuccessPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  )
}

export default App
