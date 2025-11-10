import { UserButton } from '@clerk/clerk-react'
import Sidebar from '../components/Sidebar'

function TutorPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900">Smart Tutor</h2>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-gray-500">Smart Tutor - Coming in Phase 6</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TutorPage
