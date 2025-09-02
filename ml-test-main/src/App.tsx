// src/App.tsx

import { useEffect } from 'react';
import AppRouter from './router';

const App = () => {
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);
  return <AppRouter />;
};

export default App;
