
export enum SummaryCategory {
  SITE_PLANS = 'SITE_PLANS',
  FLOOR_PLANS = 'FLOOR_PLANS',
  IMAGES = 'IMAGES',
  RESPONSES = 'RESPONSES',
}

export interface Floor {
  id?: number;
  number?: number;
  plotThumbUrl?: string;
  isSite?: boolean;
  isHalf?: boolean;
}

export interface Layer {
  id?: number;
  floorId?: number;
  pictureThumbUrl?: string;
  note?: string;
}

export interface Form {
  id: number;
  formType: string;
}

export interface Building {
  renovationCode?: string;
}

export interface SummaryUiState {
  sitePlans: Floor[];
  floorPlans: Floor[];
  images: Layer[];
  forms: Form[];
  selectedCategory: SummaryCategory | null;
  building?: Building;
}

export type SummaryUiEvent = {
  type: 'SELECT_CATEGORY';
  category: SummaryCategory;
};
