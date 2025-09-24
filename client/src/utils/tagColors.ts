// Centralized tag color mapping and helpers

type TagStyle = {
  bg: string;
  text: string;
  selectedBg: string;
  selectedText: string;
};

// Explicit class strings so Tailwind JIT includes them
const tagToColor: Record<string, TagStyle> = {
  Politics:      { bg: 'bg-red-100',        text: 'text-red-700',        selectedBg: 'bg-red-200',        selectedText: 'text-red-800' },
  Economics:     { bg: 'bg-emerald-100',    text: 'text-emerald-700',    selectedBg: 'bg-emerald-200',    selectedText: 'text-emerald-800' },
  Technology:    { bg: 'bg-blue-100',       text: 'text-blue-700',       selectedBg: 'bg-blue-200',       selectedText: 'text-blue-800' },
  Science:       { bg: 'bg-violet-100',     text: 'text-violet-700',     selectedBg: 'bg-violet-200',     selectedText: 'text-violet-800' },
  Environment:   { bg: 'bg-green-100',      text: 'text-green-700',      selectedBg: 'bg-green-200',      selectedText: 'text-green-800' },
  Education:     { bg: 'bg-orange-100',     text: 'text-orange-700',     selectedBg: 'bg-orange-200',     selectedText: 'text-orange-800' },
  Religion:      { bg: 'bg-amber-200',      text: 'text-amber-800',      selectedBg: 'bg-amber-300',      selectedText: 'text-amber-900' },
  Ethics:        { bg: 'bg-rose-100',       text: 'text-rose-700',       selectedBg: 'bg-rose-200',       selectedText: 'text-rose-800' },
  Law:           { bg: 'bg-slate-100',      text: 'text-slate-700',      selectedBg: 'bg-slate-200',      selectedText: 'text-slate-800' },
  Media:         { bg: 'bg-purple-100',     text: 'text-purple-700',     selectedBg: 'bg-purple-200',     selectedText: 'text-purple-800' },
  Art:           { bg: 'bg-fuchsia-100',    text: 'text-fuchsia-700',    selectedBg: 'bg-fuchsia-200',    selectedText: 'text-fuchsia-800' },
  Music:         { bg: 'bg-violet-100',     text: 'text-violet-700',     selectedBg: 'bg-violet-200',     selectedText: 'text-violet-800' },
  Film:          { bg: 'bg-cyan-100',       text: 'text-cyan-700',       selectedBg: 'bg-cyan-200',       selectedText: 'text-cyan-800' },
  Sports:        { bg: 'bg-orange-100',     text: 'text-orange-700',     selectedBg: 'bg-orange-200',     selectedText: 'text-orange-800' },
  Health:        { bg: 'bg-emerald-100',    text: 'text-emerald-700',    selectedBg: 'bg-emerald-200',    selectedText: 'text-emerald-800' },
  Food:          { bg: 'bg-amber-100',      text: 'text-amber-700',      selectedBg: 'bg-amber-200',      selectedText: 'text-amber-800' },
  Travel:        { bg: 'bg-sky-100',        text: 'text-sky-700',        selectedBg: 'bg-sky-200',        selectedText: 'text-sky-800' },
  Relationships: { bg: 'bg-orange-100',     text: 'text-orange-700',     selectedBg: 'bg-orange-200',     selectedText: 'text-orange-800' },
  Family:        { bg: 'bg-lime-100',       text: 'text-lime-700',       selectedBg: 'bg-lime-200',       selectedText: 'text-lime-800' },
  Friendship:    { bg: 'bg-cyan-100',       text: 'text-cyan-700',       selectedBg: 'bg-cyan-200',       selectedText: 'text-cyan-800' },
  Career:        { bg: 'bg-indigo-100',     text: 'text-indigo-700',     selectedBg: 'bg-indigo-200',     selectedText: 'text-indigo-800' },
  Fashion:       { bg: 'bg-pink-100',       text: 'text-pink-700',       selectedBg: 'bg-pink-200',       selectedText: 'text-pink-800' },
  Pets:          { bg: 'bg-teal-100',       text: 'text-teal-700',       selectedBg: 'bg-teal-200',       selectedText: 'text-teal-800' },
  Gaming:        { bg: 'bg-indigo-100',     text: 'text-indigo-700',     selectedBg: 'bg-indigo-200',     selectedText: 'text-indigo-800' },
  Internet:      { bg: 'bg-sky-100',        text: 'text-sky-700',        selectedBg: 'bg-sky-200',        selectedText: 'text-sky-800' },
  History:       { bg: 'bg-neutral-100',    text: 'text-neutral-700',    selectedBg: 'bg-neutral-200',    selectedText: 'text-neutral-800' },
  Philosophy:    { bg: 'bg-slate-100',      text: 'text-slate-700',      selectedBg: 'bg-slate-200',      selectedText: 'text-slate-800' },
  Space:         { bg: 'bg-indigo-200',     text: 'text-indigo-900',     selectedBg: 'bg-indigo-300',     selectedText: 'text-indigo-900' },
  Lifestyle:     { bg: 'bg-pink-100',       text: 'text-pink-700',       selectedBg: 'bg-pink-200',       selectedText: 'text-pink-800' }
};

const fallback: TagStyle = { bg: 'bg-gray-100', text: 'text-gray-700', selectedBg: 'bg-gray-200', selectedText: 'text-gray-800' };

export const getTagClasses = (tag: string, selected = false): string => {
  const style = tagToColor[tag] || fallback;
  return selected
    ? `${style.selectedBg} ${style.selectedText}`
    : `${style.bg} ${style.text}`;
};

export const getTagStyle = (tag: string): TagStyle => tagToColor[tag] || fallback;

export const getAllTagNames = (): string[] => Object.keys(tagToColor);


