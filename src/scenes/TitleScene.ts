import Phaser from 'phaser';
import { t, setLang } from '../i18n/i18n';
import { gameState } from '../systems/GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class TitleScene extends Phaser.Scene {
  private selectedMode: 1 | 2 = gameState.playerMode;
  private langClicked = false;

  constructor() { super('TitleScene'); }

  create() {
    this.selectedMode = gameState.playerMode;
    const isTouch = this.sys.game.device.input.touch;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    this.add.text(GAME_WIDTH / 2, 110, t('title'), {
      fontFamily: 'monospace', fontSize: '48px',
      color: '#ffdd44', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 170, '👮 Police Adventure', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5);

    const btnStyle = {
      fontFamily: 'monospace', fontSize: '20px',
      color: '#ffffff', backgroundColor: '#334466',
      padding: { x: 20, y: 10 },
    };

    if (isTouch) {
      // Mobile: single centered button, tap anywhere to start
      this.selectedMode = 1;

      const btn1P = this.add.text(GAME_WIDTH / 2, 255, '▶  START', {
        ...btnStyle, fontSize: '26px', backgroundColor: '#2255cc', color: '#ffdd44',
        padding: { x: 32, y: 14 },
      }).setOrigin(0.5).setInteractive();
      btn1P.on('pointerdown', () => this.startGame());

      this.add.text(GAME_WIDTH / 2, 330, 'Companion cop follows automatically', {
        fontFamily: 'monospace', fontSize: '12px', color: '#778899', align: 'center',
        wordWrap: { width: 560 },
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 365, '↑ Jump   ◄ Left   ● Fire   Right ►', {
        fontFamily: 'monospace', fontSize: '13px', color: '#556677',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 390, 'Walk up to stunned enemy to arrest', {
        fontFamily: 'monospace', fontSize: '11px', color: '#445566',
      }).setOrigin(0.5);

      const startText = this.add.text(GAME_WIDTH / 2, 440, 'Tap anywhere to start', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: startText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
    } else {
      // Desktop: 1P / 2P mode selection
      this.add.text(GAME_WIDTH / 2, 230, 'Select Mode', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ccccdd',
      }).setOrigin(0.5);

      const btn1P = this.add.text(GAME_WIDTH / 2 - 120, 275, '1 PLAYER',  btnStyle).setOrigin(0.5).setInteractive();
      const btn2P = this.add.text(GAME_WIDTH / 2 + 120, 275, '2 PLAYERS', btnStyle).setOrigin(0.5).setInteractive();

      const highlight = (mode: 1 | 2) => {
        this.selectedMode = mode;
        btn1P.setStyle({ color: mode === 1 ? '#ffdd44' : '#aaaaaa', backgroundColor: mode === 1 ? '#2255cc' : '#334466' });
        btn2P.setStyle({ color: mode === 2 ? '#ffdd44' : '#aaaaaa', backgroundColor: mode === 2 ? '#2255cc' : '#334466' });
      };

      btn1P.on('pointerdown', () => highlight(1));
      btn2P.on('pointerdown', () => highlight(2));
      btn1P.on('pointerover', () => { if (this.selectedMode !== 1) btn1P.setStyle({ color: '#ccddff' }); });
      btn2P.on('pointerover', () => { if (this.selectedMode !== 2) btn2P.setStyle({ color: '#ccddff' }); });

      highlight(this.selectedMode);

      this.add.text(GAME_WIDTH / 2, 320, 'In 1P mode the companion cop follows automatically', {
        fontFamily: 'monospace', fontSize: '12px', color: '#778899', align: 'center',
        wordWrap: { width: 560 },
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 360, 'P1: Arrow Keys + Space  |  P2: WASD + F', {
        fontFamily: 'monospace', fontSize: '12px', color: '#556677',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 385, 'Walk up to stunned enemy to arrest  |  1 / 2 to select mode', {
        fontFamily: 'monospace', fontSize: '11px', color: '#445566',
      }).setOrigin(0.5);

      const startText = this.add.text(GAME_WIDTH / 2, 430, t('press_start'), {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: startText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

      const kb = this.input.keyboard!;
      kb.on('keydown-ONE',   () => highlight(1));
      kb.on('keydown-TWO',   () => highlight(2));
      kb.on('keydown-ENTER', () => this.startGame());
      kb.on('keydown-SPACE', () => this.startGame());
    }

    const langBtn = this.add.text(GAME_WIDTH - 12, 12, 'DE / EN', {
      fontFamily: 'monospace', fontSize: '12px', color: '#556677',
    }).setOrigin(1, 0).setInteractive();
    let lang: 'en' | 'de' = 'en';
    langBtn.on('pointerdown', () => {
      this.langClicked = true;
      lang = lang === 'en' ? 'de' : 'en';
      setLang(lang);
      this.scene.restart();
    });

    // Tap/click anywhere dismisses the title screen (after a short guard delay).
    // langClicked guard prevents the lang button from also navigating away.
    this.time.delayedCall(300, () => {
      this.input.on('pointerdown', () => {
        if (!this.langClicked) this.startGame();
      });
    });
  }

  private startGame() {
    gameState.playerMode = this.selectedMode;
    gameState.reset();
    this.scene.start('OverworldScene');
  }
}
