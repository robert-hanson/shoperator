import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Header } from '@/components/layout/Header'
import { PageShell } from '@/components/layout/PageShell'
import { HomePage } from '@/pages/HomePage'
import { ComparePage } from '@/pages/ComparePage'
import { AdminPage } from '@/pages/AdminPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Header />
        <PageShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare/:slug" element={<ComparePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </PageShell>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
