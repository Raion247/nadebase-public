import { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { FaCheck, FaAngleDoubleRight } from "react-icons/fa";
import { useNotification } from '../C/noti';
import AuthContext from './AC';

const UP = ({ onClose }) => {
  const { paymentInfo, setPaymentInfo } = useContext(AuthContext);
  const [selectedTier, setSelectedTier] = useState(null);
  const { showNotification, NotificationComponent } = useNotification();
  const paypalButtonsRef = useRef(null);
  const isRenderingRef = useRef(false);

  const allTiers = [
    {
      id: 'Free',
      name: 'Free',
      price: '$0 / month',
      features: ['Daily Uploads: 3', 'Monthly Uploads: 10', 'Save Collections: 5'],
      recommended: false
    },
    {
      id: 'Supporter',
      name: 'Supporter',
      price: '$1.99 / month',
      features: ['Daily Uploads: 20', 'Monthly Uploads: 100', 'Save Collections: 20', 'Custom Name Color'],
      recommended: false
    },
    {
      id: 'Legend',
      name: 'Legend',
      price: '$3.99 / month',
      features: ['Daily Uploads: 50', 'Monthly Uploads: 250', 'Save Collections: 50', 'Custom Name Color'],
      recommended: true
    }
  ];

  const tierOrder = { Free: 0, Supporter: 1, Legend: 2 };

  const visibleTiers = useMemo(() => {
    return allTiers.filter(t => tierOrder[t.id] >= tierOrder[paymentInfo.tier || 'Free']);
  }, [paymentInfo.tier]);

  useEffect(() => {
    if (!document.getElementById('paypal-js')) {
      const script = document.createElement('script');
      script.id = 'paypal-js';
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_CID}&vault=true&intent=subscription`;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!window.paypal || !selectedTier || isRenderingRef.current) return;
    if (selectedTier === paymentInfo.tier) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    isRenderingRef.current = true;

    let planId;
    if (selectedTier === 'Supporter') planId = 'P-93J86692LH4718841NEL3KHY';
    else if (selectedTier === 'Legend') planId = 'P-4D0268625G470580RNEL3KQI';
    else {
      isRenderingRef.current = false;
      return;
    }

    try {
      if (paypalButtonsRef.current) {
        try {
          paypalButtonsRef.current.close();
        } catch {}
        paypalButtonsRef.current = null;
      }

      container.innerHTML = '';

      const buttons = window.paypal.Buttons({
        style: { shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' },
        createSubscription: (data, actions) =>
          actions.subscription.create({ plan_id: planId }),
        onApprove: async (data) => {
          const subscriptionID = data.subscriptionID;
          try {
            const res = await fetch('/api/payment/upgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier: selectedTier, subscriptionId: subscriptionID })
            });
            const result = await res.json();
            if (result.success) {
              setPaymentInfo({
                tier: result.tier,
                isPaid: true,
                subscriptionExpires: result.subscriptionEnds,
                autoCancel: false
              });
              showNotification(`Your ${selectedTier} plan is now active!`, 'success');
            } else {
              showNotification('Something went wrong while saving subscription.', 'error');
            }
          } catch (err) {
            console.error('Error upgrading plan:', err);
            showNotification('Failed to save subscription. Please contact support.', 'error');
          }
        },
        onError: (err) => {
          if (err?.message?.includes('Detected popup close')) {
            showNotification('User closed PayPal popup before completing payment.');
            return;
          }
          console.error('PayPal button error:', err);
          showNotification('PayPal button error. Please try again.', 'error');
        }
      });

      if (buttons.isEligible()) {
        paypalButtonsRef.current = buttons;
        buttons.render('#paypal-button-container').catch((err) => {
          console.error('Error rendering PayPal buttons:', err);
        });
      }
    } catch (err) {
      console.error('Error creating PayPal buttons:', err);
    } finally {
      setTimeout(() => {
        isRenderingRef.current = false;
      }, 100);
    }
  }, [selectedTier, paymentInfo?.tier]);

  const colorizeNumbers = (text, tierId) => {
    let colorClass = 'text-white';
    if (tierId === 'Supporter') colorClass = 'text-yellow-400 font-bold';
    else if (tierId === 'Legend') colorClass = 'text-green-400 font-bold';
    return text.replace(/(\d+)/g, `<span class="${colorClass}">&nbsp;$1&nbsp;</span>`);
  };

  const normalize = (str) => str.toLowerCase().replace(/collections|uploads|:/g, '').trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-xl md:max-w-5xl w-full p-4 md:p-6 shadow-xl my-8 md:my-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {visibleTiers.map((tier) => {
            const currentTier =
              paymentInfo?.tier &&
              ['Supporter', 'Legend'].includes(paymentInfo.tier)
                ? allTiers.find((t) => t.id === paymentInfo.tier)
                : allTiers[0];

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative border rounded-lg p-4 md:p-5 cursor-pointer transition-all hover:scale-103 
                  ${
                    tier.recommended
                      ? 'border-amber-400 bg-gradient-to-b from-gray-800 to-gray-900 shadow-[0_0_20px_rgba(255,191,0,0.2)] hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]'
                      : 'border-gray-600'
                  } 
                  ${selectedTier === tier.id ? 'ring-2 ring-blue-500' : ''}
                  w-full max-w-[340px] md:max-w-[420px] xl:max-w-[460px] mx-auto md:mx-0
                `}
              >
                <h3 className="text-base md:text-xl font-bold text-white mb-2 flex items-center justify-between">
                  <span>{tier.name}</span>
                  {paymentInfo.tier === tier.id && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Current</span>
                  )}
                </h3>

                <div className={`text-lg md:text-2xl font-extrabold mb-1 md:mb-4 ${
                  tier.id === 'Legend' ? 'text-green-400' : tier.id === 'Supporter' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {tier.price}
                </div>

                <ul className="space-y-1 md:space-y-2 p-0 md:pb-1">
                  {tier.features.map((feature, i) => {
                    const match = feature.match(/(.+?):\s*(\d+)/);
                    const label = match ? match[1].trim() : feature;
                    const value = match ? parseInt(match[2]) : null;
                    const currentFeature = currentTier.features.find(f => normalize(f).includes(normalize(label)));
                    const currentMatch = currentFeature?.match(/(\d+)/);
                    const currentValue = currentMatch ? parseInt(currentMatch[1]) : null;

                    const colorClass = tier.id === 'Legend' ? 'text-green-400' : 'text-yellow-400';

                    if (value && currentValue && value !== currentValue) {
                      return (
                        <li key={i} className="flex items-center text-gray-300 text-sm md:text-base leading-snug">
                          <FaCheck className="text-green-500 mr-2" />
                          <span className="flex items-center gap-2">
                            <span className="text-white">{label}:</span>
                            <span className="text-red-400 font-semibold">{currentValue}</span>
                            <FaAngleDoubleRight className={colorClass} />
                            <span className={`${colorClass} font-bold`}>{value}</span>
                          </span>
                        </li>
                      );
                    }

                    return (
                      <li key={i} className="flex items-center text-gray-300 text-sm md:text-base leading-snug">
                        <FaCheck className="text-green-500 mr-2" />
                        <span dangerouslySetInnerHTML={{ __html: colorizeNumbers(feature, tier.id) }} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* PayPal */}
        {selectedTier ? (
          selectedTier === paymentInfo.tier ? (
            <p className="text-gray-400 text-center italic">
              You are already on the <span className="text-blue-400 font-semibold">{selectedTier}</span> plan.
            </p>
          ) : (
            <div className="flex flex-col items-center space-y-3 -mt-5 -mb-17">
              <div id="paypal-button-container" className='w-full max-w-[240px] scale-80'></div>
            </div>
          )
        ) : (
          <p className="text-gray-400 text-center italic">Select a plan to continue</p>
        )}

        {/* Close */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
      <NotificationComponent />
    </div>
  );
};
export default UP;