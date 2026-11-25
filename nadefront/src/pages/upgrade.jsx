import U from '../C/U';
import F from '../C/F';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../C/TC';

export default function Upgrade() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col text-white ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <Helmet>
        <title>Nadebase – Extensive CS2 Lineup Database</title>
      </Helmet>
      <main className="flex-1">
        <U />
      </main>
      <F />
    </div>
  )
}