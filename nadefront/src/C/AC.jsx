import { createContext } from 'react';

const AuthContext = createContext({
  user: null,
  paymentInfo: {
    tier: 'Free',
    isPaid: false,
    subscriptionEnds: null,
    autoCancel: false,
    isAdmin: false
  },
  setPaymentInfo: () => {},
  loading: true,
  error: null,
  logout: async () => {},
  checkAuth: async () => {},
});

export default AuthContext;