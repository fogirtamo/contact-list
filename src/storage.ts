export function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

export function getAllGroupsFromStorage(): { id: string, name: string }[] {
  const groups: { id: string, name: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key !== 'loglevel') {
      groups.push({ id: generateId(), name: key });
    }
  }
  return groups;
}

export function getAllGroupNamesFromStorage(): string[] {
  const names: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key !== 'loglevel') names.push(key);
  }
  return names;
}