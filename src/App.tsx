import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Ping silencioso al cargar la página
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Mi Portfolio</h1>
    </div>
  );

}

export default App
