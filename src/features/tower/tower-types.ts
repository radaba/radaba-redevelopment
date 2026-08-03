export type TowerScalar = string | number | boolean | null;

export interface RawTowerRecord {
  [field: string]: unknown;
}

export interface Tower {
  firebaseKey: string;
  tower_id: TowerScalar;
  site_id: TowerScalar;
  sitename: TowerScalar;
  site_type: TowerScalar;
  latitude: TowerScalar;
  longitude: TowerScalar;
  region: TowerScalar;
  sub_region: TowerScalar;
  province: TowerScalar;
  kabupaten: TowerScalar;
  kecamatan: TowerScalar;
  new_cluster_name: TowerScalar;
  bts_type: TowerScalar;
  antenna_system: TowerScalar;
  antenna_type: TowerScalar;
  g900: TowerScalar;
  g1800: TowerScalar;
  u900: TowerScalar;
  u2100: TowerScalar;
  l700: TowerScalar;
  l850: TowerScalar;
  l900: TowerScalar;
  l1800: TowerScalar;
  l2100: TowerScalar;
  l2300: TowerScalar;
  l2600: TowerScalar;
  additionalFields: Record<string, TowerScalar>;
}

