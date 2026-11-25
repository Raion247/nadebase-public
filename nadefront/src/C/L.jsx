import N from "./N";
import PT from "../hooks/PT";
import ST from "../hooks/ST";
import { useTheme } from '../C/TC';
import { Outlet } from "react-router-dom";
import { Suspense } from "react";

export default function Layout() {
  const { theme } = useTheme();
  PT();
  return (
    <div className={`min-h-screen text-white flex flex-col ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <ST />
      <N />
      <Suspense fallback={<div className="flex-1" />}>
        <Outlet />
      </Suspense>
    </div>
  );
}