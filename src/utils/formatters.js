export const formatDistance = (distance) => {
  return distance.toFixed(1);
};

export const formatTime = (hours) => {
  const totalMinutes = Math.round(hours * 60);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;

  if (hoursPart === 0) {
    return `${minutesPart} min`;
  }

  return `${hoursPart}h ${minutesPart}min`;
};
