/** Balanced group assignment (snake draft by seed order). */
export function assignTeamsToGroups(
  teamIds: string[],
  groupCount: number
): Record<string, string> {
  const groups = Array.from({ length: groupCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const buckets: string[][] = groups.map(() => []);
  teamIds.forEach((teamId, index) => {
    const round = Math.floor(index / groupCount);
    const pos = index % groupCount;
    const groupIndex = round % 2 === 0 ? pos : groupCount - 1 - pos;
    buckets[groupIndex].push(teamId);
  });
  const assignments: Record<string, string> = {};
  buckets.forEach((bucket, gi) => {
    bucket.forEach((teamId) => {
      assignments[teamId] = groups[gi];
    });
  });
  return assignments;
}

export function getTeamsInGroup(
  assignments: Record<string, string>,
  groupId: string
): string[] {
  return Object.entries(assignments)
    .filter(([, g]) => g === groupId)
    .map(([teamId]) => teamId);
}
