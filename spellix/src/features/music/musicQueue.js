export function createShuffledTrackQueue(
  tracks,
  { previousTrack = '', randomFn = Math.random } = {}
) {
  const queue = [...tracks];

  for (let index = queue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFn() * (index + 1));
    [queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]];
  }

  if (queue.length > 1 && queue[0] === previousTrack) {
    const replacementIndex = queue.findIndex(
      (track) => track !== previousTrack
    );
    [queue[0], queue[replacementIndex]] = [
      queue[replacementIndex],
      queue[0],
    ];
  }

  return queue;
}
