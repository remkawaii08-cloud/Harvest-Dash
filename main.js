import './style.css';
import Game from './src/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
