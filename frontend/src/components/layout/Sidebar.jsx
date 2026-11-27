import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Flower2, MessageSquareCode, Apple, User } from 'lucide-react';
import FitVerseLogo from '../common/FitVerseLogo';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home", icon: LayoutGrid },
    { to: "/yoga-studio", label: "Yoga Studio", icon: Flower2 },
    { to: "/diet", label: "Diet Planner", icon: Apple },
    { to: "/assistant", label: "AI Assistant", icon: MessageSquareCode },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#F0E6F7] flex flex-col justify-between min-h-screen select-none shrink-0 relative z-20">
      <div>
        {/* FitVerse Logo Branding */}
        <div className="px-6 py-6">
          <FitVerseLogo size="md" />
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isStudioLink = item.to === "/yoga-studio" || item.to === "/studio";
            const isStudioPath = location.pathname === "/yoga-studio" || location.pathname === "/studio";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => {
                  const active = isActive || (isStudioLink && isStudioPath);
                  return `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-fitverse-lavender text-fitverse-purple font-bold shadow-sm"
                      : "text-fitverse-dark hover:bg-[#F9F5FC] hover:text-fitverse-purple"
                  }`;
                }}
              >
                {({ isActive }) => {
                  const active = isActive || (isStudioLink && isStudioPath);
                  return (
                    <>
                      <Icon className={`w-5 h-5 ${active ? "text-fitverse-purple" : "text-fitverse-muted"}`} />
                      <span>{item.label}</span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom SVG Illustration (not a screenshot) */}
      <div className="p-4 flex flex-col items-center justify-center pointer-events-none relative overflow-hidden">
        <img
          src="/assets/sidebar_yogi_illustration.svg"
          alt="Yoga Illustration"
          className="w-40 h-auto opacity-80 select-none"
        />
      </div>
    </aside>
  );
}
