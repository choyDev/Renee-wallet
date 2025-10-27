// lib/events.ts
export const walletEventBus = {
    refresh() {
      window.dispatchEvent(new CustomEvent("wallet:refresh"));
    },
    onRefresh(cb: () => void) {
      window.addEventListener("wallet:refresh", cb);
    },
    offRefresh(cb: () => void) {
      window.removeEventListener("wallet:refresh", cb);
    },
  };
  