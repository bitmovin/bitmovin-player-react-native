export function UUID() {
  const uniqueId = new Date(Math.ceil(Math.random() * 1e13))
    .valueOf()
    .toString(36);
  return uniqueId;
}
