import { aiService } from "./ai";

export interface ComponentSpec {
  name: string;
  type: 'functional' | 'class' | 'hook' | 'page';
  props?: ComponentProp[];
  state?: StateItem[];
  hooks?: string[];
  dependencies?: string[];
  styling?: 'tailwind' | 'css' | 'styled-components';
  accessibility?: boolean;
  responsive?: boolean;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

export interface StateItem {
  name: string;
  type: string;
  initial: any;
}

export interface GeneratedComponent {
  name: string;
  code: string;
  tests?: string;
  stories?: string;
  documentation?: string;
  dependencies: string[];
}

export class ComponentGenerator {
  
  /**
   * Generate React component from description
   */
  async generateFromDescription(
    description: string, 
    framework: 'react' | 'vue' | 'svelte' = 'react',
    options?: {
      typescript?: boolean;
      tests?: boolean;
      stories?: boolean;
      accessibility?: boolean;
      responsive?: boolean;
    }
  ): Promise<GeneratedComponent> {
    
    const opts = {
      typescript: true,
      tests: false,
      stories: false,
      accessibility: true,
      responsive: true,
      ...options
    };

    const prompt = `
You are an expert ${framework} developer. Generate a high-quality, production-ready component based on this description:

Description: ${description}

Requirements:
- Framework: ${framework.toUpperCase()}
- TypeScript: ${opts.typescript ? 'Yes' : 'No'}
- Accessibility: ${opts.accessibility ? 'WCAG AA compliant' : 'Basic'}
- Responsive: ${opts.responsive ? 'Mobile-first responsive design' : 'Desktop only'}
- Styling: Use Tailwind CSS classes
- Modern best practices and patterns

Generate:
1. Main component code with proper TypeScript types
2. ${opts.tests ? 'Comprehensive test suite using Jest and React Testing Library' : ''}
3. ${opts.stories ? 'Storybook stories with multiple variants' : ''}

The component should be:
- Well-structured and maintainable
- Performant with proper optimization
- Accessible with ARIA labels and keyboard navigation
- Responsive across all device sizes
- Type-safe with proper TypeScript interfaces
- Include proper error handling
- Use modern React patterns (hooks, functional components)

Respond with a JSON object:
{
  "name": "ComponentName",
  "code": "// Full component code here",
  "tests": ${opts.tests ? '"// Test code here"' : 'null'},
  "stories": ${opts.stories ? '"// Storybook stories here"' : 'null'},
  "documentation": "// Brief usage documentation",
  "dependencies": ["array", "of", "required", "npm", "packages"]
}`;

    const response = await aiService.generateResponse(prompt);
    
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      const component = JSON.parse(jsonStr.trim());
      return this.validateComponent(component);
    } catch (error) {
      console.error("Error parsing component response:", error);
      throw new Error("Failed to generate valid component");
    }
  }

  /**
   * Generate component from specification
   */
  async generateFromSpec(spec: ComponentSpec): Promise<GeneratedComponent> {
    const description = `
Create a ${spec.type} component named "${spec.name}" with:
${spec.props ? `Props: ${spec.props.map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`).join(', ')}` : ''}
${spec.state ? `State: ${spec.state.map(s => `${s.name}: ${s.type}`).join(', ')}` : ''}
${spec.hooks ? `Hooks: ${spec.hooks.join(', ')}` : ''}
${spec.dependencies ? `External libraries: ${spec.dependencies.join(', ')}` : ''}
Styling: ${spec.styling || 'tailwind'}
Accessibility: ${spec.accessibility ? 'Required' : 'Basic'}
Responsive: ${spec.responsive ? 'Required' : 'Desktop only'}`;

    return this.generateFromDescription(description);
  }

  /**
   * Generate preset components
   */
  async generatePresetComponent(preset: string, customization?: string): Promise<GeneratedComponent> {
    const presets = {
      'form': 'Dynamic form component with validation, multiple input types, submit handling, error display, and accessibility features',
      'table': 'Data table with sorting, filtering, pagination, row selection, and responsive design',
      'modal': 'Accessible modal dialog with backdrop, close functionality, focus management, and animations',
      'carousel': 'Image/content carousel with navigation, indicators, autoplay, and touch/swipe support',
      'chart': 'Interactive chart component using recharts with multiple chart types and responsive design',
      'calendar': 'Full calendar component with date selection, events, navigation, and accessibility',
      'dashboard': 'Admin dashboard layout with sidebar, header, main content area, and responsive design',
      'auth': 'Authentication forms with login, register, forgot password, and validation',
      'payment': 'Payment form with Stripe integration, validation, and success/error handling',
      'chat': 'Real-time chat interface with message history, typing indicators, and emoji support',
      'search': 'Advanced search component with filters, autocomplete, and results display',
      'profile': 'User profile component with avatar upload, form editing, and settings management'
    };

    const description = presets[preset as keyof typeof presets];
    if (!description) {
      throw new Error(`Unknown preset: ${preset}`);
    }

    const fullDescription = customization ? 
      `${description}. Additional customizations: ${customization}` : 
      description;

    return this.generateFromDescription(fullDescription);
  }

  /**
   * Generate custom hook
   */
  async generateHook(name: string, description: string): Promise<GeneratedComponent> {
    const hookDescription = `
Create a custom React hook named "${name}" that ${description}.
The hook should:
- Follow React hooks rules and best practices
- Include proper TypeScript types
- Handle edge cases and errors gracefully
- Include cleanup logic where necessary
- Be reusable and well-documented
- Include proper dependency arrays for useEffect/useMemo/useCallback`;

    return this.generateFromDescription(hookDescription, 'react', {
      typescript: true,
      tests: true,
      accessibility: false,
      responsive: false
    });
  }

  /**
   * Generate page component
   */
  async generatePage(name: string, description: string, layout?: string): Promise<GeneratedComponent> {
    const pageDescription = `
Create a complete page component named "${name}" that ${description}.
${layout ? `Use ${layout} layout structure.` : ''}
The page should:
- Include proper page structure and navigation
- Be fully responsive and accessible
- Include proper SEO meta tags and structured data
- Handle loading and error states
- Include proper TypeScript types
- Use modern React patterns and hooks`;

    return this.generateFromDescription(pageDescription, 'react', {
      typescript: true,
      tests: false,
      accessibility: true,
      responsive: true
    });
  }

  /**
   * Validate generated component
   */
  private validateComponent(component: any): GeneratedComponent {
    if (!component.name || !component.code) {
      throw new Error("Component must have name and code");
    }

    if (!component.dependencies) {
      component.dependencies = [];
    }

    // Basic validation of React component code
    if (!component.code.includes('export') || 
        (!component.code.includes('function') && !component.code.includes('const') && !component.code.includes('class'))) {
      throw new Error("Generated code doesn't appear to be a valid React component");
    }

    return component;
  }

  /**
   * Generate component variations
   */
  async generateVariations(baseComponent: GeneratedComponent, variations: string[]): Promise<GeneratedComponent[]> {
    const results: GeneratedComponent[] = [baseComponent];

    for (const variation of variations) {
      const description = `
Take this base component and create a variation: ${variation}

Base component:
\`\`\`tsx
${baseComponent.code}
\`\`\`

Create a modified version that implements the requested variation while maintaining the core functionality and structure.`;

      try {
        const variant = await this.generateFromDescription(description);
        variant.name = `${baseComponent.name}${variation.replace(/\s+/g, '')}`;
        results.push(variant);
      } catch (error) {
        console.warn(`Failed to generate variation "${variation}":`, error);
      }
    }

    return results;
  }

  /**
   * Optimize component code
   */
  async optimizeComponent(component: GeneratedComponent): Promise<GeneratedComponent> {
    const prompt = `
Optimize this React component for performance, accessibility, and maintainability:

\`\`\`tsx
${component.code}
\`\`\`

Improvements to make:
1. Performance: Add React.memo, useMemo, useCallback where beneficial
2. Bundle size: Remove unnecessary imports and code
3. Accessibility: Enhance ARIA labels, keyboard navigation, screen reader support
4. Error handling: Add proper error boundaries and validation
5. TypeScript: Improve type safety and inference
6. Code quality: Reduce complexity, improve readability

Return the optimized component code only, maintaining all original functionality.`;

    const response = await aiService.generateResponse(prompt);
    
    // Extract code from response
    const codeMatch = response.match(/```(?:tsx?|javascript)?\s*([\s\S]*?)\s*```/);
    const optimizedCode = codeMatch ? codeMatch[1] : response;

    return {
      ...component,
      code: optimizedCode.trim(),
      name: `${component.name}Optimized`
    };
  }
}