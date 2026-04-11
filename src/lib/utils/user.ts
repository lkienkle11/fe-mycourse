type PickCharacterResult = {
  label: string;
  color: string;
  backgroundColor: string;
};

export function pickCharacter(username: string): PickCharacterResult {
  const trimmedName = username.trim();
  if (!trimmedName) {
    return { label: "U", color: "#6B7280", backgroundColor: "#F3F4F6" };
  }

  const words = trimmedName
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const label =
    words.length > 1
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < trimmedName.length; i += 1) {
    hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 72;
  const lightness = 42;
  const bgSaturation = 60;
  const bgLightness = 94;

  return {
    label,
    color: `hsl(${hue} ${saturation}% ${lightness}%)`,
    backgroundColor: `hsl(${hue} ${bgSaturation}% ${bgLightness}%)`,
  };
}
