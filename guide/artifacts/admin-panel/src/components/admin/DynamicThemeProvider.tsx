import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeService, ThemeConfig } from '@/services/theme.service';

const ThemeContext = createContext<{
  theme: ThemeConfig | null;
  updateLocalTheme: (config: ThemeConfig) => void;
  refreshTheme: () => Promise<void>;
}>({
  theme: null,
  updateLocalTheme: () => {},
  refreshTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

const defaultTheme: ThemeConfig = {
  fontFamily: 'Montserrat',
  headingFont: 'Montserrat',
  bodyFont: 'Montserrat',
  fontSizeBase: '16',
  fontSizeHeading: '32',
  fontWeightNormal: '400',
  fontWeightBold: '700',
  primaryColor: '#FF5B00',
  secondaryColor: '#1B2A4A',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  buttonColor: '#FF5B00',
  buttonHoverColor: '#E65200',
  buttonTextColor: '#FFFFFF',
  buttonRadius: '12',
  cardBgColor: '#FFFFFF',
  cardRadius: '24',
  cardShadow: '0 10px 40px rgba(0,0,0,0.03)',
  borderColor: '#F1F5F9',
  borderWidth: '1',
  spacingUnit: '4',
  containerWidth: '1280',
  darkMode: false
};

export const DynamicThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    
    // Core Colors
    root.style.setProperty('--primary-hex', config.primaryColor);
    root.style.setProperty('--secondary-hex', config.secondaryColor);
    root.style.setProperty('--background-hex', config.backgroundColor);
    root.style.setProperty('--foreground-hex', config.textColor);
    
    // For components still using the base --primary etc
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--secondary', config.secondaryColor);
    root.style.setProperty('--background', config.backgroundColor);
    root.style.setProperty('--foreground', config.textColor);
    
    // Buttons
    if (config.buttonStylePreset) {
      let radius = '12px';
      let bg = config.buttonColor || '#FF6B00';
      let text = config.buttonTextColor || '#FFFFFF';
      let border = 'none';
      
      if (config.buttonStylePreset.includes('box')) radius = '0px';
      else if (config.buttonStylePreset.includes('curved')) radius = '8px';
      else if (config.buttonStylePreset.includes('rounded')) radius = '9999px';

      if (config.buttonStylePreset.includes('hollow')) {
        bg = 'transparent';
        text = config.buttonColor || '#FF6B00';
        border = `2px solid ${config.buttonColor || '#FF6B00'}`;
      }
      
      root.style.setProperty('--radius-button', radius);
      root.style.setProperty('--button-bg', bg);
      root.style.setProperty('--button-text', text);
      root.style.setProperty('--button-border', border);
    } else {
      root.style.setProperty('--button-bg', config.buttonColor);
      root.style.setProperty('--button-hover', config.buttonHoverColor);
      root.style.setProperty('--button-text', config.buttonTextColor);
      root.style.setProperty('--radius-button', `${config.buttonRadius}px`);
    }

    if (config.sectionHeadingStyle) root.style.setProperty('--section-heading-style', config.sectionHeadingStyle);
    if (config.tourCardStyle) root.style.setProperty('--tour-card-style', config.tourCardStyle);
    if (config.collectionCardStyle) root.style.setProperty('--collection-card-style', config.collectionCardStyle);
    if (config.headerStylePreset) root.style.setProperty('--header-style-preset', config.headerStylePreset);
    
    // Cards
    root.style.setProperty('--card', config.cardBgColor);
    root.style.setProperty('--radius-card', `${config.cardRadius}px`);
    root.style.setProperty('--shadow-card', config.cardShadow);
    
    // Borders
    root.style.setProperty('--border', config.borderColor);
    root.style.setProperty('--border-width', `${config.borderWidth}px`);
    
    // Typography
    root.style.setProperty('--font-primary', config.fontFamily);
    root.style.setProperty('--font-heading', config.headingFont);
    root.style.setProperty('--font-body', config.bodyFont);
    root.style.setProperty('--text-base', `${config.fontSizeBase}px`);
    root.style.setProperty('--text-heading', `${config.fontSizeHeading}px`);
    
    // Layout
    root.style.setProperty('--container-width', `${config.containerWidth}px`);
    root.style.setProperty('--spacing-unit', `${config.spacingUnit}px`);

    // Force font family on body
    root.style.fontFamily = config.fontFamily;
  };

  const refreshTheme = async () => {
    try {
      const config = await themeService.get();
      setTheme(config);
      applyTheme(config);
    } catch (error) {
      console.error('Failed to load theme, using default:', error);
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  };

  const updateLocalTheme = (config: ThemeConfig) => {
    setTheme(config);
    applyTheme(config);
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, updateLocalTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
