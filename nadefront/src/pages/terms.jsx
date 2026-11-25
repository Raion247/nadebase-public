import TOS from '../C/TOS';
import { useTheme } from '../C/TC';

export default function Terms() {
    const { theme } = useTheme();
    return(
        <div className={`min-h-screen text-white ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
            <TOS />
        </div>
    )
}