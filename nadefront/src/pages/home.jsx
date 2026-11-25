import CBX from '../C/CBX';
import SD from '../C/SD';
import CD from '../C/CD';
import CS from '../C/CS';
import LR from '../C/LR';
import SU from '../C/SU';
import F from '../C/F';
import { useTheme } from '../C/TC';
import { useNotification } from '../C/noti';
import { Helmet } from 'react-helmet-async';
import '../index.css'

export default function Home() {
  const { theme } = useTheme();
  const { showNotification, NotificationComponent } = useNotification();

  return (
    <div className={`min-h-screen text-white transition-colors duration-1000 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <Helmet>
        <title>Nadebase – Start Building Your CS2 Lineup Collection</title>
      </Helmet>

      <div className="pt-10 gpu-isolate">
        <CBX />
        <CS showNotification={showNotification} />
        <SD showNotification={showNotification} />
        <CD showNotification={showNotification} />
        <LR />
        <SU showNotification={showNotification} />
        <F />
      </div>

      <NotificationComponent />
    </div>
  );
}