import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Code, 
  Palette, 
  PenTool, 
  Video, 
  Database,
  Layers
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All Tasks', icon: Layers },
  { id: 'ppt', label: 'PPT/Slides', icon: FileText },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'data_entry', label: 'Data Entry', icon: Database },
];

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        return (
          <Button
            key={category.id}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={isSelected ? 'bg-primary' : ''}
          >
            <Icon className="h-4 w-4 mr-1" />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
