import { ReactNode } from 'react';
import { Link } from 'wouter';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      
      {/* Powered by ShopLink footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Powered by{' '}
              <Link href="/">
                <span className="font-semibold text-primary cursor-pointer hover:underline">
                  ShopLink
                </span>
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Create your own online store at{' '}
              <Link href="/">
                <span className="text-primary hover:underline cursor-pointer">
                  shoplynk.app
                </span>
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
