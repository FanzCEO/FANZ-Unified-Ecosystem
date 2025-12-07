import { aiService } from "./ai";

export interface SchemaField {
  name: string;
  type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'json' | 'uuid' | 'decimal' | 'array';
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  defaultValue?: any;
  references?: { table: string; column: string };
  arrayOf?: string;
}

export interface TableSchema {
  name: string;
  fields: SchemaField[];
  relations?: Relation[];
}

export interface Relation {
  type: 'oneToMany' | 'manyToOne' | 'manyToMany';
  table: string;
  foreignKey?: string;
  throughTable?: string;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  indexes?: Index[];
}

export interface Index {
  table: string;
  columns: string[];
  unique?: boolean;
}

export class SchemaGenerator {
  
  /**
   * Generate database schema from natural language description
   */
  async generateFromDescription(description: string, context?: string): Promise<DatabaseSchema> {
    const prompt = `
You are a database schema expert. Generate a comprehensive database schema based on this description:

Description: ${description}
${context ? `Context: ${context}` : ''}

Create a complete database schema with:
1. All necessary tables with proper relationships
2. Primary keys, foreign keys, and indexes
3. Appropriate data types
4. Nullable/non-nullable constraints
5. Unique constraints where needed
6. Default values where appropriate

Respond with a JSON object matching this TypeScript interface:

interface DatabaseSchema {
  tables: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'json' | 'uuid' | 'decimal' | 'array';
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      defaultValue?: any;
      references?: { table: string; column: string };
      arrayOf?: string;
    }>;
    relations?: Array<{
      type: 'oneToMany' | 'manyToOne' | 'manyToMany';
      table: string;
      foreignKey?: string;
      throughTable?: string;
    }>;
  }>;
  indexes?: Array<{
    table: string;
    columns: string[];
    unique?: boolean;
  }>;
}

Generate a production-ready schema with best practices for performance and scalability.`;

    const response = await aiService.generateResponse(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      const schema = JSON.parse(jsonStr.trim());
      return this.validateSchema(schema);
    } catch (error) {
      console.error("Error parsing schema response:", error);
      throw new Error("Failed to generate valid schema");
    }
  }

  /**
   * Generate schema for common application patterns
   */
  async generatePresetSchema(preset: string): Promise<DatabaseSchema> {
    const presets = {
      'ecommerce': 'E-commerce platform with products, users, orders, payments, inventory, categories, reviews, and shopping cart functionality',
      'blog': 'Blog platform with posts, authors, comments, categories, tags, and user management',
      'social': 'Social media platform with users, posts, comments, likes, follows, messages, and notifications',
      'crm': 'Customer relationship management system with contacts, companies, deals, activities, and sales pipeline',
      'learning': 'Learning management system with courses, students, instructors, lessons, quizzes, and progress tracking',
      'marketplace': 'Multi-vendor marketplace with sellers, buyers, products, orders, payments, and reviews',
      'saas': 'SaaS application with users, organizations, subscriptions, billing, and feature management',
      'content': 'Content management system with pages, media, menus, users, and SEO management',
      'adult': 'Adult content platform with creators, subscribers, content, payments, age verification, and compliance tracking',
      'crypto': 'Cryptocurrency platform with wallets, transactions, trading pairs, orders, and portfolio tracking'
    };

    const description = presets[preset as keyof typeof presets];
    if (!description) {
      throw new Error(`Unknown preset: ${preset}`);
    }

    return this.generateFromDescription(description, `This is a ${preset} application`);
  }

  /**
   * Generate Drizzle ORM schema code
   */
  generateDrizzleSchema(schema: DatabaseSchema): string {
    let imports = new Set(['pgTable', 'text', 'integer', 'boolean', 'timestamp', 'json', 'uuid', 'decimal']);
    let code = `import { sql } from 'drizzle-orm';\nimport { `;

    // Add table definitions
    const tables: string[] = [];
    
    schema.tables.forEach(table => {
      const fields: string[] = [];
      
      table.fields.forEach(field => {
        let fieldDef = `${field.name}: `;
        
        switch (field.type) {
          case 'text':
            fieldDef += `text('${field.name}')`;
            break;
          case 'integer':
            fieldDef += `integer('${field.name}')`;
            break;
          case 'boolean':
            fieldDef += `boolean('${field.name}')`;
            break;
          case 'timestamp':
            fieldDef += `timestamp('${field.name}')`;
            break;
          case 'json':
            fieldDef += `json('${field.name}')`;
            break;
          case 'uuid':
            fieldDef += `uuid('${field.name}')`;
            break;
          case 'decimal':
            fieldDef += `decimal('${field.name}')`;
            break;
          case 'array':
            fieldDef += `text('${field.name}').array()`;
            break;
        }
        
        if (field.primaryKey) {
          fieldDef += '.primaryKey()';
        }
        if (field.unique) {
          fieldDef += '.unique()';
        }
        if (!field.nullable && !field.primaryKey) {
          fieldDef += '.notNull()';
        }
        if (field.defaultValue !== undefined) {
          fieldDef += `.default(${JSON.stringify(field.defaultValue)})`;
        }
        if (field.name.includes('_at')) {
          fieldDef += '.defaultNow()';
        }
        
        fields.push(`  ${fieldDef}`);
      });
      
      const tableDef = `export const ${table.name} = pgTable('${table.name}', {\n${fields.join(',\n')}\n});`;
      tables.push(tableDef);
    });
    
    // Generate complete schema
    code = `import { sql } from 'drizzle-orm';
import { ${Array.from(imports).join(', ')} } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

${tables.join('\n\n')}

// Relations
${schema.tables.map(table => {
  if (!table.relations?.length) return '';
  
  const relationDefs = table.relations.map(rel => {
    switch (rel.type) {
      case 'oneToMany':
        return `    ${rel.table}: many(${rel.table})`;
      case 'manyToOne':
        return `    ${rel.table}: one(${rel.table}, { fields: [${table.name}.${rel.foreignKey}], references: [${rel.table}.id] })`;
      case 'manyToMany':
        return `    ${rel.table}: many(${rel.throughTable})`;
      default:
        return '';
    }
  }).filter(Boolean);
  
  if (relationDefs.length === 0) return '';
  
  return `export const ${table.name}Relations = relations(${table.name}, ({ one, many }) => ({
${relationDefs.join(',\n')}
}));`;
}).filter(Boolean).join('\n\n')}

// Types
${schema.tables.map(table => 
`export type ${table.name.charAt(0).toUpperCase() + table.name.slice(1)} = typeof ${table.name}.$inferSelect;
export type Insert${table.name.charAt(0).toUpperCase() + table.name.slice(1)} = typeof ${table.name}.$inferInsert;`
).join('\n')}`;

    return code;
  }

  /**
   * Validate generated schema
   */
  private validateSchema(schema: any): DatabaseSchema {
    if (!schema.tables || !Array.isArray(schema.tables)) {
      throw new Error("Schema must have tables array");
    }
    
    schema.tables.forEach((table: any, index: number) => {
      if (!table.name || !table.fields) {
        throw new Error(`Table ${index} missing name or fields`);
      }
      
      let hasPrimaryKey = false;
      table.fields.forEach((field: any) => {
        if (!field.name || !field.type) {
          throw new Error(`Invalid field in table ${table.name}`);
        }
        if (field.primaryKey) hasPrimaryKey = true;
      });
      
      if (!hasPrimaryKey) {
        // Add auto id field if no primary key
        table.fields.unshift({
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          defaultValue: 'gen_random_uuid()'
        });
      }
    });
    
    return schema;
  }

  /**
   * Generate migration SQL from schema
   */
  generateMigrationSQL(schema: DatabaseSchema): string {
    const sql: string[] = [];
    
    schema.tables.forEach(table => {
      const columns = table.fields.map(field => {
        let colDef = `"${field.name}" `;
        
        switch (field.type) {
          case 'text':
            colDef += 'TEXT';
            break;
          case 'integer':
            colDef += 'INTEGER';
            break;
          case 'boolean':
            colDef += 'BOOLEAN';
            break;
          case 'timestamp':
            colDef += 'TIMESTAMP';
            break;
          case 'json':
            colDef += 'JSONB';
            break;
          case 'uuid':
            colDef += 'UUID';
            break;
          case 'decimal':
            colDef += 'DECIMAL';
            break;
          case 'array':
            colDef += 'TEXT[]';
            break;
        }
        
        if (field.primaryKey) {
          colDef += ' PRIMARY KEY';
        }
        if (!field.nullable && !field.primaryKey) {
          colDef += ' NOT NULL';
        }
        if (field.unique) {
          colDef += ' UNIQUE';
        }
        if (field.defaultValue !== undefined) {
          colDef += ` DEFAULT ${field.defaultValue}`;
        }
        
        return colDef;
      });
      
      sql.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (\n  ${columns.join(',\n  ')}\n);`);
      
      // Add foreign key constraints
      table.fields.forEach(field => {
        if (field.references) {
          sql.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${field.name}" FOREIGN KEY ("${field.name}") REFERENCES "${field.references.table}"("${field.references.column}");`);
        }
      });
    });
    
    // Add indexes
    if (schema.indexes) {
      schema.indexes.forEach(index => {
        const indexName = `idx_${index.table}_${index.columns.join('_')}`;
        const unique = index.unique ? 'UNIQUE ' : '';
        sql.push(`CREATE ${unique}INDEX IF NOT EXISTS "${indexName}" ON "${index.table}" (${index.columns.map(col => `"${col}"`).join(', ')});`);
      });
    }
    
    return sql.join('\n\n');
  }
}