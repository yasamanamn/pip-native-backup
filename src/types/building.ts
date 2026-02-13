export type ApiBuildingSummaryInfo = {
  projectName?: string | null;
  renovationCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ApiBuilding = ApiBuildingSummaryInfo & {
  height?: number | null;
  width?: number | null;
  length?: number | null;
};
