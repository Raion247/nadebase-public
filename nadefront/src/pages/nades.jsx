import FM from '../C/FM';
import F from '../C/F';
import { useTheme } from '../C/TC';
import { Helmet } from 'react-helmet-async';

export default function Nades() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col text-white ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <Helmet>
        <title>Nadebase – Extensive CS2 Lineup Database</title>
      </Helmet>
      <main className="flex-1">
        <FM />
      </main>
      <F />
    </div>
  )
}