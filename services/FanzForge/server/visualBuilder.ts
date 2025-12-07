export interface Element {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: Element[];
  styles?: Record<string, any>;
  position?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  parentId?: string;
}

export interface Page {
  id: string;
  name: string;
  path: string;
  elements: Element[];
  layout?: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface VisualProject {
  id: string;
  name: string;
  pages: Page[];
  globalStyles?: Record<string, any>;
  theme?: string;
  components?: CustomComponent[];
}

export interface CustomComponent {
  id: string;
  name: string;
  props: ComponentProp[];
  template: Element[];
}

export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  required?: boolean;
}

export interface DragDropAction {
  type: 'move' | 'resize' | 'add' | 'remove' | 'copy';
  elementId?: string;
  targetId?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  component?: Partial<Element>;
}

export class VisualBuilder {
  
  /**
   * Available component library
   */
  getComponentLibrary(): Record<string, any> {
    return {
      // Layout Components
      Container: {
        type: 'div',
        props: { className: 'container mx-auto px-4' },
        category: 'layout',
        icon: '📦',
        description: 'Responsive container with max width',
        defaultProps: { maxWidth: 'xl', padding: '4' }
      },
      
      Grid: {
        type: 'div',
        props: { className: 'grid gap-4' },
        category: 'layout',
        icon: '🔳',
        description: 'CSS Grid layout container',
        defaultProps: { columns: 3, gap: '4' }
      },
      
      Flex: {
        type: 'div',
        props: { className: 'flex' },
        category: 'layout',
        icon: '↔️',
        description: 'Flexbox layout container',
        defaultProps: { direction: 'row', align: 'center', justify: 'start' }
      },

      // Text Components
      Heading: {
        type: 'h1',
        props: { className: 'text-2xl font-bold' },
        category: 'typography',
        icon: '📝',
        description: 'Heading text element',
        defaultProps: { level: 1, size: '2xl', weight: 'bold' }
      },
      
      Text: {
        type: 'p',
        props: { className: 'text-base' },
        category: 'typography',
        icon: '📄',
        description: 'Paragraph text element',
        defaultProps: { size: 'base', color: 'gray-900' }
      },
      
      Link: {
        type: 'a',
        props: { className: 'text-blue-600 hover:underline' },
        category: 'typography',
        icon: '🔗',
        description: 'Hyperlink element',
        defaultProps: { href: '#', target: '_self' }
      },

      // Form Components
      Button: {
        type: 'button',
        props: { className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700' },
        category: 'forms',
        icon: '🔘',
        description: 'Interactive button element',
        defaultProps: { variant: 'primary', size: 'md' }
      },
      
      Input: {
        type: 'input',
        props: { className: 'px-3 py-2 border rounded focus:outline-none focus:ring-2' },
        category: 'forms',
        icon: '📝',
        description: 'Text input field',
        defaultProps: { type: 'text', placeholder: 'Enter text...' }
      },
      
      Select: {
        type: 'select',
        props: { className: 'px-3 py-2 border rounded' },
        category: 'forms',
        icon: '📋',
        description: 'Dropdown selection field',
        defaultProps: { options: ['Option 1', 'Option 2', 'Option 3'] }
      },
      
      Textarea: {
        type: 'textarea',
        props: { className: 'px-3 py-2 border rounded resize-vertical' },
        category: 'forms',
        icon: '📝',
        description: 'Multi-line text input',
        defaultProps: { rows: 4, placeholder: 'Enter text...' }
      },

      // Media Components
      Image: {
        type: 'img',
        props: { className: 'max-w-full h-auto', src: 'https://via.placeholder.com/300x200', alt: 'Image' },
        category: 'media',
        icon: '🖼️',
        description: 'Responsive image element',
        defaultProps: { width: '300', height: '200' }
      },
      
      Video: {
        type: 'video',
        props: { className: 'max-w-full h-auto', controls: true },
        category: 'media',
        icon: '🎥',
        description: 'Video player element',
        defaultProps: { controls: true, autoplay: false }
      },

      // Navigation Components
      Navbar: {
        type: 'nav',
        props: { className: 'bg-white shadow-sm border-b' },
        category: 'navigation',
        icon: '🧭',
        description: 'Navigation bar component',
        defaultProps: { sticky: true, background: 'white' }
      },
      
      Breadcrumb: {
        type: 'nav',
        props: { className: 'flex text-sm text-gray-600' },
        category: 'navigation',
        icon: '🍞',
        description: 'Breadcrumb navigation trail',
        defaultProps: { separator: '/' }
      },

      // Card Components
      Card: {
        type: 'div',
        props: { className: 'bg-white rounded-lg shadow-md p-6' },
        category: 'display',
        icon: '🃏',
        description: 'Card container with shadow',
        defaultProps: { padding: '6', shadow: 'md', rounded: 'lg' }
      },
      
      Modal: {
        type: 'div',
        props: { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center' },
        category: 'overlay',
        icon: '🗔',
        description: 'Modal dialog overlay',
        defaultProps: { backdrop: true, centered: true }
      },

      // Data Display
      Table: {
        type: 'table',
        props: { className: 'w-full border-collapse border border-gray-300' },
        category: 'data',
        icon: '📊',
        description: 'Data table component',
        defaultProps: { striped: true, bordered: true }
      },
      
      List: {
        type: 'ul',
        props: { className: 'list-disc list-inside space-y-2' },
        category: 'data',
        icon: '📋',
        description: 'Unordered list component',
        defaultProps: { style: 'disc', spacing: '2' }
      }
    };
  }

  /**
   * Create new element
   */
  createElement(
    type: string, 
    props: Record<string, any> = {},
    position?: { x: number; y: number }
  ): Element {
    const library = this.getComponentLibrary();
    const componentDef = library[type] || { type: 'div', props: {} };
    
    return {
      id: this.generateId(),
      type: componentDef.type,
      props: { ...componentDef.props, ...props },
      position,
      children: []
    };
  }

  /**
   * Add element to parent
   */
  addElement(
    project: VisualProject, 
    pageId: string, 
    element: Element, 
    parentId?: string
  ): VisualProject {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    if (parentId) {
      const parent = this.findElement(page.elements, parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push({ ...element, parentId });
      }
    } else {
      page.elements.push(element);
    }

    return { ...project };
  }

  /**
   * Remove element
   */
  removeElement(project: VisualProject, pageId: string, elementId: string): VisualProject {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    this.removeElementRecursive(page.elements, elementId);
    return { ...project };
  }

  /**
   * Move element
   */
  moveElement(
    project: VisualProject, 
    pageId: string, 
    elementId: string, 
    newPosition: { x: number; y: number }
  ): VisualProject {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    const element = this.findElement(page.elements, elementId);
    if (element) {
      element.position = { ...element.position, ...newPosition };
    }

    return { ...project };
  }

  /**
   * Update element properties
   */
  updateElement(
    project: VisualProject, 
    pageId: string, 
    elementId: string, 
    updates: Partial<Element>
  ): VisualProject {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    const element = this.findElement(page.elements, elementId);
    if (element) {
      Object.assign(element, updates);
    }

    return { ...project };
  }

  /**
   * Clone element
   */
  cloneElement(project: VisualProject, pageId: string, elementId: string): VisualProject {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    const element = this.findElement(page.elements, elementId);
    if (element) {
      const cloned = this.deepCloneElement(element);
      cloned.id = this.generateId();
      if (cloned.position) {
        cloned.position.x += 20;
        cloned.position.y += 20;
      }
      page.elements.push(cloned);
    }

    return { ...project };
  }

  /**
   * Generate React component code from visual project
   */
  generateReactCode(project: VisualProject, pageId: string): string {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('Page not found');

    const imports = this.generateImports(page);
    const component = this.generatePageComponent(page);
    
    return `${imports}\n\n${component}`;
  }

  /**
   * Generate complete Next.js app from project
   */
  generateNextJsApp(project: VisualProject): Record<string, string> {
    const files: Record<string, string> = {};
    
    // Generate package.json
    files['package.json'] = this.generatePackageJson(project);
    
    // Generate pages
    project.pages.forEach(page => {
      const fileName = page.path === '/' ? 'index.tsx' : `${page.path.slice(1)}.tsx`;
      files[`pages/${fileName}`] = this.generateReactCode(project, page.id);
    });
    
    // Generate layout component
    files['components/Layout.tsx'] = this.generateLayoutComponent();
    
    // Generate styles
    files['styles/globals.css'] = this.generateGlobalStyles(project);
    
    // Generate config files
    files['next.config.js'] = this.generateNextConfig();
    files['tailwind.config.js'] = this.generateTailwindConfig();
    
    return files;
  }

  /**
   * Export project to different formats
   */
  exportProject(project: VisualProject, format: 'react' | 'nextjs' | 'html' | 'figma'): any {
    switch (format) {
      case 'react':
        return this.exportToReactComponents(project);
      case 'nextjs':
        return this.generateNextJsApp(project);
      case 'html':
        return this.exportToHTML(project);
      case 'figma':
        return this.exportToFigmaTokens(project);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private findElement(elements: Element[], id: string): Element | null {
    for (const element of elements) {
      if (element.id === id) return element;
      if (element.children) {
        const found = this.findElement(element.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeElementRecursive(elements: Element[], id: string): boolean {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].id === id) {
        elements.splice(i, 1);
        return true;
      }
      if (elements[i].children && this.removeElementRecursive(elements[i].children!, id)) {
        return true;
      }
    }
    return false;
  }

  private deepCloneElement(element: Element): Element {
    return {
      ...element,
      props: { ...element.props },
      styles: element.styles ? { ...element.styles } : undefined,
      position: element.position ? { ...element.position } : undefined,
      children: element.children ? element.children.map(child => this.deepCloneElement(child)) : undefined
    };
  }

  private generateImports(page: Page): string {
    return `import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';`;
  }

  private generatePageComponent(page: Page): string {
    const elementCode = page.elements.map(el => this.elementToJSX(el, 0)).join('\n');
    
    return `const ${this.toCamelCase(page.name)}Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>${page.meta?.title || page.name}</title>
        ${page.meta?.description ? `<meta name="description" content="${page.meta.description}" />` : ''}
      </Head>
      <div className="min-h-screen">
        ${elementCode}
      </div>
    </>
  );
};

export default ${this.toCamelCase(page.name)}Page;`;
  }

  private elementToJSX(element: Element, indent: number): string {
    const spaces = '  '.repeat(indent);
    const props = this.propsToString(element.props);
    const Tag = element.type;
    
    if (element.children && element.children.length > 0) {
      const childrenJSX = element.children
        .map(child => this.elementToJSX(child, indent + 1))
        .join('\n');
      
      return `${spaces}<${Tag}${props}>
${childrenJSX}
${spaces}</${Tag}>`;
    } else {
      return `${spaces}<${Tag}${props} />`;
    }
  }

  private propsToString(props: Record<string, any>): string {
    return Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return ` ${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? ` ${key}` : '';
        } else {
          return ` ${key}={${JSON.stringify(value)}}`;
        }
      })
      .join('');
  }

  private toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  private generatePackageJson(project: VisualProject): string {
    return JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^13.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        tailwindcss: '^3.0.0'
      },
      devDependencies: {
        '@types/node': '^18.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        autoprefixer: '^10.0.0',
        eslint: '^8.0.0',
        'eslint-config-next': '^13.0.0',
        postcss: '^8.0.0',
        typescript: '^4.9.0'
      }
    }, null, 2);
  }

  private generateLayoutComponent(): string {
    return `import React from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'My App' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>{children}</main>
    </>
  );
};

export default Layout;`;
  }

  private generateGlobalStyles(project: VisualProject): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

${project.globalStyles ? Object.entries(project.globalStyles).map(([selector, styles]) => 
  `${selector} { ${Object.entries(styles as any).map(([prop, value]) => `${prop}: ${value};`).join(' ')} }`
).join('\n') : ''}`;
  }

  private generateNextConfig(): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com'],
  },
};

module.exports = nextConfig;`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};`;
  }

  private exportToReactComponents(project: VisualProject): Record<string, string> {
    const components: Record<string, string> = {};
    
    project.pages.forEach(page => {
      components[`${page.name}.tsx`] = this.generateReactCode(project, page.id);
    });
    
    return components;
  }

  private exportToHTML(project: VisualProject): Record<string, string> {
    const files: Record<string, string> = {};
    
    project.pages.forEach(page => {
      files[`${page.name}.html`] = this.generateHTMLPage(page);
    });
    
    return files;
  }

  private generateHTMLPage(page: Page): string {
    const bodyContent = page.elements.map(el => this.elementToHTML(el, 0)).join('\n');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.meta?.title || page.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    ${bodyContent}
</body>
</html>`;
  }

  private elementToHTML(element: Element, indent: number): string {
    const spaces = '  '.repeat(indent);
    const attrs = Object.entries(element.props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    if (element.children && element.children.length > 0) {
      const childrenHTML = element.children
        .map(child => this.elementToHTML(child, indent + 1))
        .join('\n');
      
      return `${spaces}<${element.type} ${attrs}>
${childrenHTML}
${spaces}</${element.type}>`;
    } else {
      return `${spaces}<${element.type} ${attrs}></${element.type}>`;
    }
  }

  private exportToFigmaTokens(project: VisualProject): any {
    // Generate design tokens compatible with Figma
    return {
      colors: project.theme ? this.extractColorsFromTheme(project.theme) : {},
      typography: this.extractTypographyTokens(project),
      spacing: this.extractSpacingTokens(project),
      components: this.extractComponentTokens(project)
    };
  }

  private extractColorsFromTheme(theme: string): Record<string, string> {
    // Extract color tokens from theme
    return {};
  }

  private extractTypographyTokens(project: VisualProject): Record<string, any> {
    // Extract typography tokens
    return {};
  }

  private extractSpacingTokens(project: VisualProject): Record<string, string> {
    // Extract spacing tokens
    return {};
  }

  private extractComponentTokens(project: VisualProject): Record<string, any> {
    // Extract component design tokens
    return {};
  }
}