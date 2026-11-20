interface FollowStats {
  followers: number;
  following: number;
  notFollowingBack: number;
  notFollowedBack: number;
  mutual: number;
}

export function verifyFollowSetInvariants(stats: FollowStats): boolean {
  const followingValid = stats.following === stats.notFollowingBack + stats.mutual;
  const followersValid = stats.followers === stats.notFollowedBack + stats.mutual;
  return followingValid && followersValid;
}
