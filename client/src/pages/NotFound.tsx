import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <h2 className="mt-2 text-xl font-semibold text-gray-700">Page Not Found</h2>
            <p className="mt-2 text-gray-600">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link href="/">
              <a className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Go Home
              </a>
            </Link>
            
            <Link href="/demo/coastal-treasures">
              <a className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                View Demo Store
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}