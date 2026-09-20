/** Keyboard shortcuts shared by every page that has a player. */
import { useEffect } from 'react';
import { ignoreShortcut } from './keys';
import type { Player } from './usePlayer';

/**
 * Binds Space, arrows, Home/End, and [ ] to a player while the page is mounted.
 * @param player - the player to control
 */
export function useShortcuts(player: Player): void {
  useEffect(() => {
    /** Playback shortcuts: Space, arrows, Home/End, and [ ] for speed. */
    const onKey = (e: KeyboardEvent) => {
      if (ignoreShortcut(e)) return;
      if (e.key === ' ') {
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowRight') player.next();
      else if (e.key === 'ArrowLeft') player.prev();
      else if (e.key === 'Home') player.first();
      else if (e.key === 'End') player.last();
      else if (e.key === '[') player.setSpeed(Math.max(0.25, player.speed / 2));
      else if (e.key === ']') player.setSpeed(Math.min(8, player.speed * 2));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
}
