/*
 * Gamification utilities for SpicyBeats.
 * Provides functions to compute XP levels and badges for a user.
 */

export function getLevel(xp) {
  if (xp === undefined || xp === null) xp = 0;
  if (xp < 100) return 'newbie';
  if (xp < 500) return 'explorer';
  return 'deal_king';
}

export function getLevelName(key) {
  switch (key) {
    case 'newbie': return 'Newbie';
    case 'explorer': return 'Explorer';
    case 'deal_king': return 'Deal King';
    default: return '';
  }
}

/**
 * Compute badges for a user.
 * Accepts an object with user stats: dealsCount, votesCount, isVerifiedBusiness
 * Returns array of badge objects: { name, description }
 */
export function computeBadges(stats) {
  const badges = [];
  if (stats.dealsCount > 0) {
    badges.push({ name: 'First Deal', description: 'Posted your first deal' });
  }
  if (stats.votesCount >= 100) {
    badges.push({ name: '100 Votes', description: 'Received 100 votes across your deals' });
  }
  if (stats.isVerifiedBusiness) {
    badges.push({ name: 'Verified Business', description: 'Your business is verified' });
  }
  return badges;
}