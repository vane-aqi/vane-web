
'use client';

import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      
        
          🦝
          Raccoon inc.
        
        
        
          
            About Us
          
          
            Contact Us
          
        
        
        <button 
          className="md:hidden text-3xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      
    </>
  );
}