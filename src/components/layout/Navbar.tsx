'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DG</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">DataGov</span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/datasets"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Datasets
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                  <Link
                    href="/dashboard/datasets/new"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Publish
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block">{user?.name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/downloads"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Downloads
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin/audit"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Audit Log
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
