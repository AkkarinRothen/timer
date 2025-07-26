class LocalDB {
  constructor(prefix = 'db') {
    this.prefix = prefix;
  }

  _key(key) {
    return `${this.prefix}_${key}`;
  }

  set(key, value) {
    localStorage.setItem(this._key(key), JSON.stringify(value));
  }

  get(key) {
    const item = localStorage.getItem(this._key(key));
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch (e) {
      console.warn(`LocalDB: invalid data for ${key}, clearing`);
      localStorage.removeItem(this._key(key));
      return null;
    }
  }

  remove(key) {
    localStorage.removeItem(this._key(key));
  }

  keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix + '_')) {
        keys.push(k.slice(this.prefix.length + 1));
      }
    }
    return keys;
  }
}

window.LocalDB = LocalDB;
