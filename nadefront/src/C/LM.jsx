import useAuth from '../hooks/UA';

const LM = () => {
  const { user } = useAuth();
  const level = user?.level || 1;
  const progress = user?.levelProgress || 0;
  const xp = user?.xp || 0;

  return (
    <div className="w-full max-w-xs mt-4">
      <div className="flex justify-between mb-1 text-sm text-gray-600">
        <span>Level {level}</span>
        <span>{xp} XP</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-500 h-2 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LM;