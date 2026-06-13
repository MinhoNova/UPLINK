export const CLASS_ICONS: Record<string, string> = {
  "Evoker": "/classes/Evoker.svg",
  "Warrior": "/classes/Warrior.svg",
  "Paladin": "/classes/Paladin.svg",
  "Hunter": "/classes/Hunter.svg",
  "Rogue": "/classes/Rogue.svg",
  "Priest": "/classes/Priest.svg",
  "Death Knight": "/classes/Death Knight.svg",
  "Shaman": "/classes/Shaman.svg",
  "Mage": "/classes/Mage.svg",
  "Warlock": "/classes/Warlock.svg",
  "Monk": "/classes/Monk.svg",
  "Druid": "/classes/Druid.svg",
  "Demon Hunter": "/classes/Demon Hunter.svg",
  "Healer": "/classes/HEALER.svg",
};

export const getClassIcon = (className: string): string | null => {
  if (!className) return null;
  
  // البحث عن الكلاس (case-insensitive)
  const key = Object.keys(CLASS_ICONS).find(
    k => k.toLowerCase() === className.toLowerCase()
  );
  
  return key ? CLASS_ICONS[key] : null;
};
