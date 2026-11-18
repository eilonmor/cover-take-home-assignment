/** Escapes every RegExp metacharacter, so the text matches literally inside a `new RegExp(...)`. */
export const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
