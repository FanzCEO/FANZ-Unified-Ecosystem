/**
 * FANZ Theme Provider Component
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Theme, ThemeVariant } from '../types';
import { themes } from '../themes/clusters';

interface ThemeContextType {
  currentTheme: Theme;
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultVariant?: ThemeVariant;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultVariant = 'boyfanz' 
}) => {
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(defaultVariant);
  const currentTheme = themes[themeVariant];

  const value = {
    currentTheme,
    themeVariant,
    setThemeVariant,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={themeVariant}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
