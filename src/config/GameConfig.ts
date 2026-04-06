import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { BootScene }        from '../scenes/BootScene';
import { PreloadScene }     from '../scenes/PreloadScene';
import { TitleScene }       from '../scenes/TitleScene';
import { OverworldScene }   from '../scenes/OverworldScene';
import { CityStreetsScene } from '../scenes/CityStreetsScene';
import { PoliceCastleScene }from '../scenes/PoliceCastleScene';
import { GhostCastleScene } from '../scenes/GhostCastleScene';
import { TrainScene }       from '../scenes/TrainScene';
import { PoliceShipScene }  from '../scenes/PoliceShipScene';
import { CastleInteriorScene } from '../scenes/CastleInteriorScene';
import { CarRoadScene }     from '../scenes/CarRoadScene';
import { HUDScene }         from '../scenes/HUDScene';
import { GameOverScene }    from '../scenes/GameOverScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 600 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [
    BootScene, PreloadScene, TitleScene, OverworldScene,
    CityStreetsScene, PoliceCastleScene, GhostCastleScene,
    CastleInteriorScene, TrainScene, PoliceShipScene, CarRoadScene,
    HUDScene, GameOverScene,
  ],
};
