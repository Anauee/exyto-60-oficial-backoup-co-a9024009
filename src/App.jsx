import './App.css'
import { Toaster as SonnerToaster } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import Auth from "@/components/auth/Auth"
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Auth />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  )
}

export default App