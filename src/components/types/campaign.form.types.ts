export interface LineItem {
  id: string;
  lineItemName: string;
  ethnicity: string[];
  startDate: string;
  endDate: string;
  adFormat: string[];
  impressions: string;
  units: string[];
  creatives: File[];
  ctr: string;
  viewability: string;
  vcr: string;
}

export interface GeoLocation {
  country: string;
  state: string;
  city: string;
  address: string;
  zipcode: string;
  range: string;
}

export interface GeoAddNewSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  setOptions: (opts: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ✅ Updated to match CreativeData type in Campaign_Create.tsx
export interface CreativeData {
  type?: 'standard' | 'third_party';   // ✅ add this
  lineItemId: string | undefined;
  main_asset: File | null;                    // main asset binary
  backup_image: File | null;             // ✅ backup image binary
  creative_name: string;
  dimensions: string;
  aspect_ratio: string;
  file_size: string;
  click_through_url: string;
  appended_html_tag: string;            // ✅ was missing
  integration_code: string;            // ✅ was missing
  notes: string;                       // ✅ was missing
}

export interface LineItemCardProps {
  item: LineItem;
  index: number;
  campaignStart: string;
  campaignEnd: string;
  onChange: (id: string, field: keyof LineItem, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  lineItemCreatives: Record<string, CreativeData[]>; // ✅ use shared type
}