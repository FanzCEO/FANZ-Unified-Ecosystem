import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-taboo-accent-primary text-white hover:bg-taboo-accent-primary-hover',
        destructive:
          'bg-taboo-danger text-white hover:bg-taboo-danger/90',
        outline:
          'border border-taboo-border bg-transparent hover:bg-taboo-surface hover:text-white',
        secondary:
          'bg-taboo-surface text-white hover:bg-taboo-surface-hover',
        ghost: 'hover:bg-taboo-surface hover:text-white',
        link: 'text-taboo-accent-primary underline-offset-4 hover:underline',
        neon: 'bg-gradient-to-r from-taboo-accent-primary to-taboo-glitch text-white font-bold hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] transition-shadow',
        glitch:
          'bg-taboo-glitch text-black hover:bg-taboo-glitch-hover',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
