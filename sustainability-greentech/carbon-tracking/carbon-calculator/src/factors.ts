/**
 * Emission Factors Database
 *
 * Values are in kg CO2e per unit
 * Sources: EPA, IPCC, various sustainability databases
 */

import type { EmissionFactor, TransportationType, EnergyType, FoodType } from './types.js';

// Transportation emission factors (kg CO2e per km)
export const TRANSPORTATION_FACTORS: Record<TransportationType, EmissionFactor> = {
  car_gasoline: {
    type: 'car_gasoline',
    factor: 0.21, // per passenger-km
    unit: 'km',
    source: 'EPA',
  },
  car_diesel: {
    type: 'car_diesel',
    factor: 0.17,
    unit: 'km',
    source: 'EPA',
  },
  car_hybrid: {
    type: 'car_hybrid',
    factor: 0.12,
    unit: 'km',
    source: 'EPA',
  },
  car_electric: {
    type: 'car_electric',
    factor: 0.05, // depends on grid mix
    unit: 'km',
    source: 'EPA',
  },
  motorcycle: {
    type: 'motorcycle',
    factor: 0.11,
    unit: 'km',
    source: 'EPA',
  },
  bus: {
    type: 'bus',
    factor: 0.089,
    unit: 'km',
    source: 'EPA',
  },
  train: {
    type: 'train',
    factor: 0.041,
    unit: 'km',
    source: 'EPA',
  },
  subway: {
    type: 'subway',
    factor: 0.03,
    unit: 'km',
    source: 'EPA',
  },
  airplane_domestic: {
    type: 'airplane_domestic',
    factor: 0.255,
    unit: 'km',
    source: 'ICAO',
  },
  airplane_international: {
    type: 'airplane_international',
    factor: 0.195,
    unit: 'km',
    source: 'ICAO',
  },
  bicycle: {
    type: 'bicycle',
    factor: 0,
    unit: 'km',
    source: 'N/A',
  },
  walking: {
    type: 'walking',
    factor: 0,
    unit: 'km',
    source: 'N/A',
  },
};

// Energy emission factors (kg CO2e per unit)
export const ENERGY_FACTORS: Record<EnergyType, EmissionFactor> = {
  electricity: {
    type: 'electricity',
    factor: 0.42, // varies by region
    unit: 'kWh',
    source: 'IEA',
  },
  natural_gas: {
    type: 'natural_gas',
    factor: 2.0, // per therm
    unit: 'therms',
    source: 'EPA',
  },
  heating_oil: {
    type: 'heating_oil',
    factor: 10.16, // per gallon
    unit: 'gallons',
    source: 'EPA',
  },
  propane: {
    type: 'propane',
    factor: 5.76, // per gallon
    unit: 'gallons',
    source: 'EPA',
  },
  coal: {
    type: 'coal',
    factor: 2.42, // per kg
    unit: 'kg',
    source: 'EPA',
  },
  wood: {
    type: 'wood',
    factor: 0.39, // per kg (considered carbon neutral but has some emissions)
    unit: 'kg',
    source: 'EPA',
  },
  solar: {
    type: 'solar',
    factor: 0.05, // lifecycle emissions
    unit: 'kWh',
    source: 'NREL',
  },
  wind: {
    type: 'wind',
    factor: 0.01, // lifecycle emissions
    unit: 'kWh',
    source: 'NREL',
  },
};

// Food emission factors (kg CO2e per kg of food)
export const FOOD_FACTORS: Record<FoodType, EmissionFactor> = {
  beef: {
    type: 'beef',
    factor: 27.0,
    unit: 'kg',
    source: 'Our World in Data',
  },
  pork: {
    type: 'pork',
    factor: 12.1,
    unit: 'kg',
    source: 'Our World in Data',
  },
  chicken: {
    type: 'chicken',
    factor: 6.9,
    unit: 'kg',
    source: 'Our World in Data',
  },
  fish: {
    type: 'fish',
    factor: 5.1,
    unit: 'kg',
    source: 'Our World in Data',
  },
  dairy: {
    type: 'dairy',
    factor: 3.2, // milk, cheese, etc.
    unit: 'kg',
    source: 'Our World in Data',
  },
  eggs: {
    type: 'eggs',
    factor: 4.8,
    unit: 'kg',
    source: 'Our World in Data',
  },
  vegetables: {
    type: 'vegetables',
    factor: 0.4,
    unit: 'kg',
    source: 'Our World in Data',
  },
  fruits: {
    type: 'fruits',
    factor: 0.5,
    unit: 'kg',
    source: 'Our World in Data',
  },
  grains: {
    type: 'grains',
    factor: 1.4,
    unit: 'kg',
    source: 'Our World in Data',
  },
  processed_food: {
    type: 'processed_food',
    factor: 3.5, // average
    unit: 'kg',
    source: 'Various',
  },
};

// Shopping emission factors (kg CO2e per item or kg)
export const SHOPPING_FACTORS: Record<string, EmissionFactor> = {
  clothing: {
    type: 'clothing',
    factor: 15.0, // per item average
    unit: 'item',
    source: 'Carbon Trust',
  },
  electronics: {
    type: 'electronics',
    factor: 100.0, // varies widely
    unit: 'item',
    source: 'Various',
  },
  furniture: {
    type: 'furniture',
    factor: 50.0, // per item average
    unit: 'item',
    source: 'Various',
  },
  appliances: {
    type: 'appliances',
    factor: 200.0, // per item average
    unit: 'item',
    source: 'Various',
  },
  paper_products: {
    type: 'paper_products',
    factor: 1.5, // per kg
    unit: 'kg',
    source: 'EPA',
  },
  plastic_products: {
    type: 'plastic_products',
    factor: 3.5, // per kg
    unit: 'kg',
    source: 'EPA',
  },
};

// Waste emission factors (kg CO2e per kg)
export const WASTE_FACTORS: Record<string, EmissionFactor> = {
  landfill: {
    type: 'landfill',
    factor: 0.58, // mixed waste
    unit: 'kg',
    source: 'EPA',
  },
  recycling: {
    type: 'recycling',
    factor: -0.21, // net negative (avoided emissions)
    unit: 'kg',
    source: 'EPA',
  },
  composting: {
    type: 'composting',
    factor: 0.05,
    unit: 'kg',
    source: 'EPA',
  },
  incineration: {
    type: 'incineration',
    factor: 0.91,
    unit: 'kg',
    source: 'EPA',
  },
};

// Water emission factors (kg CO2e per cubic meter)
export const WATER_FACTORS: Record<string, EmissionFactor> = {
  tap_water: {
    type: 'tap_water',
    factor: 0.344, // per cubic meter
    unit: 'm³',
    source: 'Water UK',
  },
  hot_water: {
    type: 'hot_water',
    factor: 3.0, // including heating
    unit: 'm³',
    source: 'Various',
  },
};

// Country average emissions (tonnes CO2e per capita per year)
export const COUNTRY_AVERAGES: Record<string, number> = {
  US: 16.0,
  UK: 5.5,
  DE: 8.0, // Germany
  FR: 4.5, // France
  JP: 9.0, // Japan
  CN: 7.4, // China
  IN: 1.9, // India
  BR: 2.2, // Brazil
  AU: 17.0, // Australia
  CA: 15.5, // Canada
  global: 4.7,
};

// Get all factors for a category
export function getFactorsForCategory(
  category: string
): Record<string, EmissionFactor> {
  switch (category) {
    case 'transportation':
      return TRANSPORTATION_FACTORS;
    case 'energy':
      return ENERGY_FACTORS;
    case 'food':
      return FOOD_FACTORS;
    case 'shopping':
      return SHOPPING_FACTORS;
    case 'waste':
      return WASTE_FACTORS;
    case 'water':
      return WATER_FACTORS;
    default:
      return {};
  }
}
