const listeners = [];

export const toast = {
  success(message, options) {
    listeners.forEach((fn) => fn(message, 'success', options));
  },
  error(message, options) {
    listeners.forEach((fn) => fn(message, 'error', options));
  },
  info(message, options) {
    listeners.forEach((fn) => fn(message, 'info', options));
  },
  warning(message, options) {
    listeners.forEach((fn) => fn(message, 'warning', options));
  },
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  },
};
