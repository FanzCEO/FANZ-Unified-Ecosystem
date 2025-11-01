/**
 * FANZ UI Type Definitions
 */

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export type ThemeVariant = 'boyfanz' | 'girlfanz' | 'pupfanz' | 'daddies' | 'cougarfanz' | 'taboofanz';

export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

export interface ComponentProps {
  variant?: ComponentVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}
