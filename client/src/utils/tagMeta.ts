import React from 'react';
import {
  Vote,
  DollarSign,
  Laptop,
  Microscope,
  TreePine,
  GraduationCap,
  Church,
  Scale,
  Gavel,
  Radio,
  Palette,
  Music,
  Film,
  Trophy,
  Heart,
  Utensils,
  Plane,
  Users,
  Home as HomeIcon,
  UserCheck,
  Briefcase,
  Shirt,
  Dog,
  Gamepad2,
  Globe,
  BookOpen,
  Brain,
  Rocket,
  Coffee
} from 'lucide-react';

export const getTagIcon = (tag: string): React.ComponentType<any> => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Politics: Vote,
    Economics: DollarSign,
    Technology: Laptop,
    Science: Microscope,
    Environment: TreePine,
    Education: GraduationCap,
    Religion: Church,
    Ethics: Scale,
    Law: Gavel,
    Media: Radio,
    Art: Palette,
    Music: Music,
    Film: Film,
    Sports: Trophy,
    Health: Heart,
    Food: Utensils,
    Travel: Plane,
    Relationships: Users,
    Family: HomeIcon,
    Friendship: UserCheck,
    Career: Briefcase,
    Fashion: Shirt,
    Pets: Dog,
    Gaming: Gamepad2,
    Internet: Globe,
    History: BookOpen,
    Philosophy: Brain,
    Space: Rocket,
    Lifestyle: Coffee
  };

  return iconMap[tag] || Vote;
};




