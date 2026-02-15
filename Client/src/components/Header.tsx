// File: Client/src/components/Header.tsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Users } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have cn from class-variance-authority (common with shadcn)

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu when clicking a link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="p-2.5 bg-blue-600/20 rounded-lg border border-blue-500/20">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            D's Virtual Space
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors",
                isActive
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            Explore
          </NavLink>

          <NavLink
            to="/business"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors",
                isActive
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            Business
          </NavLink>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <Link to="/login">Sign In</Link>
          </Button>

          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            asChild
          >
            <Link to="/signup">Join</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-slate-200" />
          ) : (
            <Menu className="h-6 w-6 text-slate-200" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg animate-in slide-in-from-top-5 fade-in-20">
          <nav className="container mx-auto flex flex-col gap-6 px-6 py-8">
            <NavLink
              to="/explore"
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  "text-base font-medium transition-colors py-2",
                  isActive ? "text-blue-400" : "text-slate-300 hover:text-slate-100"
                )
              }
            >
              Explore
            </NavLink>

            <NavLink
              to="/business"
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  "text-base font-medium transition-colors py-2",
                  isActive ? "text-blue-400" : "text-slate-300 hover:text-slate-100"
                )
              }
            >
              Business
            </NavLink>

            <div className="flex flex-col gap-4 pt-6 border-t border-slate-800">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                asChild
                onClick={closeMenu}
              >
                <Link to="/login">Sign In</Link>
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                asChild
                onClick={closeMenu}
              >
                <Link to="/signup">Join</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;