import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const SU = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleUpgradeRedirect = () => {
    navigate("/upgrade"); // change path if needed
  };

  return (
    <div className="mt-10 md:mt-20">
      <motion.div
        ref={sectionRef}
        initial={{ y: 100, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1, type: "spring" }}
      >
        <h2 className="text-2xl sm:text-4xl font-bold font-mono mb-6 text-center text-white">
          Enjoying the website?
        </h2>

        {/* Small intro text */}
        <div className="flex flex-col font-mono items-center text-center w-full justify-center px-5 md:px-30 mb-10">
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            Get access to additional features and support the project!
          </p>
        </div>

        {/* Supporter card styled like PaymentsChoicePage Supporter Pack */}
        <div className="flex flex-col font-mono items-center w-full justify-center px-5 md:px-30 mb-8">

          {/* Card wrapper so we can position the float */}
          <div className="relative w-full max-w-md">

            {/* Floating "More options" pill */}
            <motion.div
              onClick={handleUpgradeRedirect}
              className="
                absolute -top-3 right-3
                inline-flex items-center gap-2
                px-3 py-1 rounded-full
                bg-gradient-to-r from-amber-400/90 to-orange-400
                shadow-[0_0_18px_rgba(250,204,21,0.6)]
                cursor-pointer select-none z-10
              "
              animate={{ x: [0, 6, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            >
              <span className="text-[11px] sm:text-xs font-semibold text-black">
                Subscribe
              </span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
              >
                <FaArrowRight className="text-black text-sm" />
              </motion.span>
            </motion.div>

            {/* Entire card is clickable now */}
            <button
              onClick={handleUpgradeRedirect}
              className="
                text-left w-full group
                border rounded-lg p-5
                border-amber-400 bg-gradient-to-b from-gray-800 to-gray-900
                shadow-[0_0_25px_rgba(255,191,0,0.3)]
                hover:shadow-[0_0_40px_rgba(255,191,0,0.6)]
                transition-all
                cursor-pointer
              "
            >
              <h4 className="text-xl font-bold text-white mb-2">
                Supporter Pack
              </h4>

              {/* Payment logos */}
              <div className="absolute top-5 right-5 hidden xxs:grid grid-cols-3 gap-2 mb-3">
                <img src="/uploads/visa.svg" alt="Visa" className="rounded-md h-5 opacity-70" />
                <img src="/uploads/mastercard.svg" alt="Mastercard" className="rounded-md h-5 opacity-70" />
                <img src="/uploads/apple_pay.svg" alt="Apple Pay" className="rounded-md h-5 opacity-70" />
                <img src="/uploads/google-pay.svg" alt="Google Pay" className="rounded-md h-5 opacity-70" />
                <img src="/uploads/paypal.svg" alt="PayPal" className="rounded-md h-5 opacity-70" />
              </div>

              <div className="relative text-2xl font-bold text-amber-400 mb-2">
                <span className="text-shadow-[0_0_15px_rgba(255,191,0,1)] ">$4.99</span> / month
              </div>

              <span className="text-xs text-gray-400 border-t border-gray-700/60 pt-3 block">
                Increases most limitations & helps support development.
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SU;