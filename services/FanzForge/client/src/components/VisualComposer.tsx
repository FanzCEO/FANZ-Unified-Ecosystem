import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Block {
  id: string;
  type: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const availableBlocks: Block[] = [
  {
    id: 'paywall',
    type: 'monetization',
    name: 'Paywall Block',
    icon: 'fas fa-credit-card',
    color: 'text-primary',
    description: 'Subscription tiers and payment processing'
  },
  {
    id: 'dm-chat',
    type: 'communication',
    name: 'DM Chat',
    icon: 'fas fa-comments',
    color: 'text-secondary',
    description: 'Private messaging with tip-to-unlock'
  },
  {
    id: 'media-upload',
    type: 'content',
    name: 'Media Upload',
    icon: 'fas fa-upload',
    color: 'text-accent',
    description: '2257-compliant media uploader'
  },
  {
    id: 'age-verification',
    type: 'compliance',
    name: '2257 Form',
    icon: 'fas fa-shield-alt',
    color: 'text-yellow-400',
    description: 'Age verification and compliance'
  },
  {
    id: 'analytics',
    type: 'insights',
    name: 'Analytics',
    icon: 'fas fa-chart-bar',
    color: 'text-purple-400',
    description: 'Performance and user insights'
  },
  {
    id: 'coupons',
    type: 'monetization',
    name: 'Coupon System',
    icon: 'fas fa-ticket-alt',
    color: 'text-orange-400',
    description: 'Time-bomb links and discounts'
  }
];

export default function VisualComposer() {
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const addBlock = (blockId: string) => {
    if (!selectedBlocks.includes(blockId)) {
      setSelectedBlocks([...selectedBlocks, blockId]);
    }
  };

  const removeBlock = (blockId: string) => {
    setSelectedBlocks(selectedBlocks.filter(id => id !== blockId));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Visual Composer</h2>
        <p className="text-muted-foreground">
          Drag and drop components to build your creator app
        </p>
      </div>

      {/* Available Blocks */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Available Components</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {availableBlocks.map((block) => (
            <Card 
              key={block.id} 
              className="neon-border hover:shadow-lg transition-all cursor-pointer"
              onClick={() => addBlock(block.id)}
              data-testid={`block-${block.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <i className={`${block.icon} ${block.color} text-lg`}></i>
                  <CardTitle className="text-sm">{block.name}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {block.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected Blocks */}
      {selectedBlocks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Selected Components</h3>
          <div className="space-y-4">
            {selectedBlocks.map((blockId) => {
              const block = availableBlocks.find(b => b.id === blockId);
              if (!block) return null;
              
              return (
                <Card key={blockId} className="bg-muted" data-testid={`selected-${blockId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <i className={`${block.icon} ${block.color} text-lg`}></i>
                        <div>
                          <div className="font-medium">{block.name}</div>
                          <div className="text-sm text-muted-foreground">{block.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" data-testid={`button-configure-${blockId}`}>
                          <i className="fas fa-cog mr-2"></i>
                          Configure
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeBlock(blockId)}
                          data-testid={`button-remove-${blockId}`}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-6 flex space-x-4">
            <Button className="bg-primary text-primary-foreground" data-testid="button-generate-code">
              <i className="fas fa-code mr-2"></i>
              Generate Code
            </Button>
            <Button variant="outline" data-testid="button-preview">
              <i className="fas fa-eye mr-2"></i>
              Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
