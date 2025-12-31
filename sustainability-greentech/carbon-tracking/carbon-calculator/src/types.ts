/**
 * Carbon Calculator Types
 */

// Activity categories
export type ActivityCategory =
  | 'transportation'
  | 'energy'
  | 'food'
  | 'shopping'
  | 'waste'
  | 'water';

// Transportation types
export type TransportationType =
  | 'car_gasoline'
  | 'car_diesel'
  | 'car_hybrid'
  | 'car_electric'
  | 'motorcycle'
  | 'bus'
  | 'train'
  | 'subway'
  | 'airplane_domestic'
  | 'airplane_international'
  | 'bicycle'
  | 'walking';

// Energy types
export type EnergyType =
  | 'electricity'
  | 'natural_gas'
  | 'heating_oil'
  | 'propane'
  | 'coal'
  | 'wood'
  | 'solar'
  | 'wind';

// Food types
export type FoodType =
  | 'beef'
  | 'pork'
  | 'chicken'
  | 'fish'
  | 'dairy'
  | 'eggs'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'processed_food';

// Shopping types
export type ShoppingType =
  | 'clothing'
  | 'electronics'
  | 'furniture'
  | 'appliances'
  | 'paper_products'
  | 'plastic_products';

// Waste types
export type WasteType =
  | 'landfill'
  | 'recycling'
  | 'composting'
  | 'incineration';

// Carbon activity
export interface CarbonActivity {
  id: string;
  category: ActivityCategory;
  type: string;
  quantity: number;
  unit: string;
  timestamp: Date;
  location?: string;
  notes?: string;
}

// Transportation activity
export interface TransportationActivity extends CarbonActivity {
  category: 'transportation';
  type: TransportationType;
  quantity: number; // distance in km
  unit: 'km';
  passengers?: number;
}

// Energy activity
export interface EnergyActivity extends CarbonActivity {
  category: 'energy';
  type: EnergyType;
  quantity: number;
  unit: 'kWh' | 'therms' | 'gallons' | 'kg';
  renewable?: boolean;
}

// Food activity
export interface FoodActivity extends CarbonActivity {
  category: 'food';
  type: FoodType;
  quantity: number;
  unit: 'kg';
  organic?: boolean;
  local?: boolean;
}

// Emission factor (kg CO2e per unit)
export interface EmissionFactor {
  type: string;
  factor: number;
  unit: string;
  source?: string;
  year?: number;
}

// Carbon calculation result
export interface CarbonResult {
  activity: CarbonActivity;
  emissions: number; // kg CO2e
  factor: EmissionFactor;
  breakdown?: Record<string, number>;
}

// Carbon summary
export interface CarbonSummary {
  totalEmissions: number; // kg CO2e
  byCategory: Record<ActivityCategory, number>;
  byType: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
  activityCount: number;
  averageDaily: number;
  comparison?: {
    nationalAverage: number;
    globalAverage: number;
    percentile: number;
  };
}

// Reduction goal
export interface ReductionGoal {
  id: string;
  name: string;
  targetReduction: number; // percentage
  category?: ActivityCategory;
  startDate: Date;
  endDate: Date;
  baselineEmissions: number;
  currentEmissions: number;
}

// Reduction tip
export interface ReductionTip {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  potentialSavings: number; // kg CO2e per year
  difficulty: 'easy' | 'medium' | 'hard';
  cost: 'free' | 'low' | 'medium' | 'high';
}

// Carbon offset
export interface CarbonOffset {
  id: string;
  provider: string;
  projectType: 'reforestation' | 'renewable_energy' | 'methane_capture' | 'other';
  amount: number; // kg CO2e
  cost: number;
  currency: string;
  verified: boolean;
  certifications?: string[];
}

// User carbon profile
export interface CarbonProfile {
  id: string;
  name: string;
  country: string;
  householdSize: number;
  lifestyle: 'minimal' | 'average' | 'high_consumption';
  dietType: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore';
  homeType: 'apartment' | 'house' | 'condo';
  homeSize: number; // sq meters
  vehicles: number;
  goals?: ReductionGoal[];
}
