import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Trash2, Settings, GripVertical } from "lucide-react";
import { PageComponent } from "@shared/schema";

interface BuilderComponentProps {
  component: PageComponent;
  children: React.ReactNode;
  onEdit: (component: PageComponent) => void;
  onDelete: (componentId: string) => void;
  isSelected: boolean;
  onSelect: (component: PageComponent) => void;
}

export function BuilderComponent({
  component,
  children,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}: BuilderComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component);
      }}
      data-testid={`builder-component-${component.id}`}
    >
      {/* Component Content */}
      <div className={`${!component.isVisible ? "opacity-50" : ""}`}>
        {children}
      </div>

      {/* Controls Overlay */}
      <div className="absolute -top-10 left-0 right-0 flex items-center justify-between bg-gray-900 px-3 py-1 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-700 rounded"
            data-testid={`drag-handle-${component.id}`}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-xs text-gray-300 capitalize">
            {component.componentType}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(component);
            }}
            className="h-6 w-6 p-0 hover:bg-gray-700"
            data-testid={`edit-component-${component.id}`}
          >
            <Settings className="w-3 h-3 text-gray-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(component.id);
            }}
            className="h-6 w-6 p-0 hover:bg-red-600"
            data-testid={`delete-component-${component.id}`}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}