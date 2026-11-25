import { Link } from "react-router-dom";
import { useTheme } from '../C/TC';

export default function F() {
  const { theme } = useTheme();
  return (
    <footer className={`text-gray-400 py-6 mt-17 font-mono transition-colors duration-1000 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="max-w-7xl mx-auto pt-4 px-7 border-t border-t-gray-700 xs:rounded-full">

        {/* Top row */}
        <div className="flex flex-col xs:flex-row xs:justify-between items-center gap-1 xs:gap-0">
          <p className="text-[0.55rem] sm:text-sm whitespace-nowrap">
            &copy; {new Date().getFullYear()} nadebase.com
          </p>
          <div className="flex flex-row space-x-2 sm:space-x-4">
            <Link to="/terms-of-service" className="hover:text-white text-[0.55rem] sm:text-sm whitespace-nowrap">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="hover:text-white text-[0.55rem] sm:text-sm whitespace-nowrap">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Bottom rows */}
        <div className="flex flex-col xs:flex-row xs:justify-between mt-1">
          <p className="text-[0.55rem] sm:text-sm text-center xs:text-left">Not affiliated with Valve&nbsp;Corp.</p>
          <div className="text-[0.55rem] sm:text-sm text-center xs:text-right whitespace-nowrap">
            Contact us:{" "}
            <a href="mailto:contact@nadebase.com" className="text-orange-400 underline hover:text-white">
              contact@nadebase.com
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}