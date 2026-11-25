import { motion } from "motion/react";

const UL = ({ limits, privateInfo }) => {
  const isPrivate = !!privateInfo;
  const data = isPrivate
    ? {
        canUpload: privateInfo.canPrivateUploads,
        remaining: privateInfo.remaining,
        total: privateInfo.cap,
        used: privateInfo.used,
        message:
          privateInfo.remaining > 0
            ? `${privateInfo.remaining} private uploads remaining`
            : `Private upload cap reached!`,
        subMessage: `${privateInfo.used}/${privateInfo.cap} used`,
      }
    : (() => {
        const { daily, monthly } = limits;

        const criticalLimit =
          monthly.remaining <= daily.remaining ? "monthly" : "daily";

        const remaining = limits[criticalLimit].remaining;
        const total = limits[criticalLimit].total;

        let message;
        if (criticalLimit === "monthly") {
          if (remaining >= 3) message = `${remaining} monthly uploads remaining`;
          else if (remaining === 2) message = "2 monthly uploads remaining";
          else if (remaining === 1) message = "Last monthly upload remaining!";
          else message = "Monthly limit reached!";
        } else {
          if (remaining >= 3) message = `${remaining} daily uploads remaining`;
          else if (remaining === 2) message = "2 daily uploads remaining";
          else if (remaining === 1) message = "Last daily upload remaining!";
          else message = "Daily limit reached!";
        }

        return {
          canUpload: true, // public gating happens elsewhere; UL just displays
          remaining,
          total,
          used: total - remaining,
          message,
          subMessage: `${daily.remaining}/${daily.total} daily • ${monthly.remaining}/${monthly.total} monthly`,
        };
      })();

  const remaining = Number(data.remaining ?? 0);
  const total = Math.max(1, Number(data.total ?? 1)); // avoid divide by 0
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  const alertColor =
    !data.canUpload || remaining <= 0
      ? "bg-red-500"
      : remaining === 1
      ? "bg-orange-500"
      : remaining === 2 && !isPrivate
      ? "bg-yellow-500"
      : "bg-green-500";

  // If private addon missing, show same card but red + clear text
  const message = !data.canUpload && isPrivate
    ? "Private uploads require the addon"
    : data.message;

  const subMessage = !data.canUpload && isPrivate
    ? "Enable Private Uploads to continue"
    : data.subMessage;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative ${alertColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2`}
    >
      <div>
        <p className="font-medium">{message}</p>
        <p className="text-sm opacity-90">{subMessage}</p>
      </div>

      {/* Progress indicator (same for private + public) */}
      <div className="relative w-8 h-8">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
          />
        </svg>
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
          {Math.max(0, remaining)}
        </span>
      </div>
    </motion.div>
  );
};

export default UL;