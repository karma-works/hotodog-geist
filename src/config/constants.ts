export const GAME_WIDTH  = 960;
export const GAME_HEIGHT = 540;
export const DEFAULT_WORLD_WIDTH = 1920; // 2 screens wide

export const PLAYER_SPEED   = 160;
export const BULLET_SPEED   = 480;
export const STUN_DURATION_MS = 3000;

export const SHARED_LIVES = 3;

export const PARROT_ITEMS = [
  'parrot_hat',
  'parrot_coat',
  'parrot_gloves',
  'parrot_boots',
  'parrot_badge',
  'parrot_scarf',
] as const;
export type ParrotItem = typeof PARROT_ITEMS[number];

export const LEVELS = [
  'CityStreets',
  'PoliceCastle',
  'GhostCastle',
  'CastleInterior',
  'Train',
  'PoliceShip',
  'CarRoad',
] as const;
export type LevelKey = typeof LEVELS[number];

export const LEVEL_SCENE_MAP: Record<LevelKey, string> = {
  CityStreets:     'CityStreetsScene',
  PoliceCastle:    'PoliceCastleScene',
  GhostCastle:     'GhostCastleScene',
  CastleInterior:  'CastleInteriorScene',
  Train:           'TrainScene',
  PoliceShip:      'PoliceShipScene',
  CarRoad:         'CarRoadScene',
};
