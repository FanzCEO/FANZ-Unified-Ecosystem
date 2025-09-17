/**
 * 🔘 Button Component
 * 
 * High-performance button built on Radix UI primitives
 * Supports all 9 cluster themes with neon glow effects
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ===== BUTTON VARIANTS =====

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center rounded-md text-sm font-medium 
   ring-offset-background transition-all duration-200 ease-in-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-50
   active:scale-95 transform
   font-semibold tracking-wide`,
  {
    variants: {
      variant: {
        // Primary button with neon glow
        primary: `bg-primary-500 text-primary-50 hover:bg-primary-600 
                  shadow-neon hover:shadow-neonHover
                  border border-primary-400`,
        
        // Secondary button with outline
        secondary: `border-2 border-primary-500 text-primary-400 bg-transparent 
                    hover:bg-primary-500 hover:text-primary-50
                    shadow-sm hover:shadow-neon`,
        
        // Destructive actions
        destructive: `bg-destructive-500 text-destructive-50 hover:bg-destructive-600
                      shadow-sm hover:shadow-lg border border-destructive-400`,
        
        // Ghost button for subtle actions
        ghost: `text-primary-400 hover:bg-primary-500/10 hover:text-primary-300
                border border-transparent hover:border-primary-500/30`,
        
        // Link-style button
        link: `text-primary-400 underline-offset-4 hover:underline hover:text-primary-300
               p-0 h-auto font-medium`,
        
        // Outline variant
        outline: `border border-surface-border bg-transparent text-foreground 
                  hover:bg-accent hover:text-accent-foreground
                  shadow-sm hover:shadow-md`,
        
        // Neon variant with intense glow
        neon: `bg-primary-500 text-primary-50 hover:bg-primary-400
               shadow-neonHover hover:shadow-[0_0_50px_var(--fanz-primary-500)]
               border-2 border-primary-300
               animate-pulse hover:animate-none`,
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-sm',
        md: 'h-10 px-4 py-2 text-sm rounded-md',
        lg: 'h-12 px-6 py-3 text-base rounded-lg',
        xl: 'h-14 px-8 py-4 text-lg rounded-xl',
        icon: 'h-10 w-10 p-0 rounded-md',
        'icon-sm': 'h-8 w-8 p-0 rounded-sm',
        'icon-lg': 'h-12 w-12 p-0 rounded-lg',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      loading: false,
      fullWidth: false,
    },
  }
);

// ===== COMPONENT INTERFACES =====

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child component (polymorphic)
   */
  asChild?: boolean;
  /**
   * Loading state with spinner
   */
  loading?: boolean;
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode;
  /**
   * Cluster theme override
   */
  cluster?: string;
}

// ===== LOADING SPINNER COMPONENT =====

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ===== MAIN COMPONENT =====

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      fullWidth,
      asChild = false,
      children,
      leftIcon,
      rightIcon,
      cluster,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // Apply cluster-specific classes
    const clusterClass = cluster ? `cluster-${cluster}` : '';

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading, fullWidth, className }),
          clusterClass
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Spinner
            size={
              size === 'sm' || size === 'icon-sm'
                ? 'sm'
                : size === 'lg' || size === 'xl' || size === 'icon-lg'
                ? 'lg'
                : 'md'
            }
          />
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className={cn(loading && 'ml-2', 'flex items-center')}>
          {children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ===== SPECIALIZED BUTTON VARIANTS =====

/**
 * Primary button with cluster theming
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="primary" />
);
PrimaryButton.displayName = 'PrimaryButton';

/**
 * Secondary button with outline style
 */
export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="secondary" />
);
SecondaryButton.displayName = 'SecondaryButton';

/**
 * Destructive action button
 */
export const DestructiveButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="destructive" />
);
DestructiveButton.displayName = 'DestructiveButton';

/**
 * Ghost button for subtle actions
 */
export const GhostButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="ghost" />
);
GhostButton.displayName = 'GhostButton';

/**
 * Neon button with intense glow effect
 */
export const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="neon" />
);
NeonButton.displayName = 'NeonButton';

/**
 * Icon-only button
 */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    icon: React.ReactNode;
    'aria-label': string;
  }
>(({ icon, children, ...props }, ref) => (
  <Button {...props} ref={ref} size="icon">
    {icon}
    {children && <span className="sr-only">{children}</span>}
  </Button>
));
IconButton.displayName = 'IconButton';

// ===== BUTTON GROUP COMPONENT =====

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Button group orientation
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Attach buttons together
   */
  attached?: boolean;
  /**
   * Size for all buttons in group
   */
  size?: ButtonProps['size'];
  /**
   * Variant for all buttons in group
   */
  variant?: ButtonProps['variant'];
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      orientation = 'horizontal',
      attached = false,
      size,
      variant,
      children,
      ...props
    },
    ref
  ) => {
    const groupClasses = cn(
      'inline-flex',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      attached && orientation === 'horizontal' && '[&>*:not(:first-child)]:ml-[-1px] [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none',
      attached && orientation === 'vertical' && '[&>*:not(:first-child)]:mt-[-1px] [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none',
      !attached && (orientation === 'horizontal' ? 'space-x-2' : 'space-y-2'),
      className
    );

    // Clone children to pass common props
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Button) {
        return React.cloneElement(child, {
          size: size || child.props.size,
          variant: variant || child.props.variant,
          ...child.props,
        });
      }
      return child;
    });

    return (
      <div className={groupClasses} ref={ref} role="group" {...props}>
        {childrenWithProps}
      </div>
    );
  }
);
ButtonGroup.displayName = 'ButtonGroup';

// ===== EXPORTS =====

export { Button, buttonVariants };
export type { ButtonProps };