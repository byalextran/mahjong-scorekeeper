export const STORAGE_KEY = 'mahjong_game';
export const STARTING_SCORE = 0;
export const WINDS = ['East', 'South', 'West', 'North'];
export const WIND_CHARS = ['東', '南', '西', '北'];

// Faan to points conversion table [faan]: [selfDraw, discard]
export const FAAN_TABLE = {
  1: [2, 4],
  2: [4, 8],
  3: [8, 16],
  4: [16, 32],
  5: [32, 64],
  6: [48, 96],
  7: [64, 128],
  8: [96, 192],
  9: [128, 256],
  10: [192, 384],
  11: [256, 512],
  12: [384, 768],
  13: [512, 1024],
};

export const MAX_FAAN = Math.max(...Object.keys(FAAN_TABLE).map(Number));
