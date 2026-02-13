// types.updated.ts

export enum SummaryCategory {
  SITE_PLANS = 'SITE_PLANS',
  FLOOR_PLANS = 'FLOOR_PLANS',
  IMAGES = 'IMAGES',
  RESPONSES = 'RESPONSES',
}

// Basic building/floor/layer/form
export interface Floor {
  id?: number;
  number?: number;
  plotThumbUrl?: string;
  plotUrl?: string;
  isSite?: boolean;
  isHalf?: boolean;
  layers?: Layer[];
}

export interface Layer {
  id?: number;
  floorId?: number;
  pictureUrl?: string;
  pictureThumbUrl?: string;
  note?: string;
  targetType?: string;
  targetId?: number;
  level?: string;
  status?: string;
  comment?: string | null;
  createdAt?: string;
  createdById?: number;
  updatedById?: number | null;
  updatedAt?: string;
  updatedBy?: {
    id: number;
    name: string;
    role: string;
  } | null;
}

export interface Form {
  id: number;
  formType: string;
}

export interface Building {
  id?: string;
  renovationCode?: string;
  name?: string;
  address?: string;
  floors?: Floor[];
}

// Summary Details per level
export interface SummaryLevelDetails {
  BUILDING?: Layer[];
  FLOOR?: Layer[];
  NOTE?: Layer[];
  PICTURE?: Layer[];
  INSTALLATION?: Layer[];
  PIP?: Layer[];
}

export interface SummaryDetails {
  STATION?: SummaryLevelDetails;
  ZONE?: SummaryLevelDetails;
  DEPARTMENT?: SummaryLevelDetails;
}

// Summary Aggregations per level
export interface SummaryAggs {
  STATION?: {
    floors: string;
    notes: string;
    pictures: string;
    installations: string;
    pip: string;
    fireCheckList: string;
  };
  ZONE?: {
    floors: string;
    notes: string;
    pictures: string;
    installations: string;
    pip: string;
    fireCheckList: string;
  };
  DEPARTMENT?: {
    floors: string;
    notes: string;
    pictures: string;
    installations: string;
    pip: string;
    fireCheckList: string;
  };
}

// UI State
export interface SummaryUiState {
  isLoading: boolean;
  building: Building | null;
  forms: Form[];
  sitePlans: Floor[];
  floorPlans: Floor[];
  images: Layer[];
  selectedCategory: SummaryCategory | null;
  details?: SummaryDetails;
  aggs?: SummaryAggs;
}

// UI Events
export type SummaryUiEvent =
  | { type: 'SELECT_CATEGORY'; category: SummaryCategory }
  | { type: 'CLEAR_SELECTION' };
