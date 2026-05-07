import {
  getStoredSolanaNetwork,
  normalizeSolanaNetwork,
  setStoredSolanaNetwork,
  type SolanaNetworkValue,
} from "../../lib/network/solana-network";

const HEADER_PRIORITY_KEY = "solana-priority-fee";
const HEADER_JITO_KEY = "solana-jito-fee";

const networkPicker = document.getElementById("header-network-picker");
const networkTrigger = document.getElementById("header-network-trigger");
const networkMenu = document.getElementById("header-network-menu");
const networkCurrentLabel = document.getElementById("header-network-current-label");
const networkCurrentIcon = document.getElementById("header-network-current-icon");
const networkCurrentMainnetIcon = document.getElementById("header-network-current-icon-mainnet");
const networkCurrentDevnetIcon = document.getElementById("header-network-current-icon-devnet");
const networkMainnetCheck = document.getElementById("header-network-check-mainnet");
const networkDevnetCheck = document.getElementById("header-network-check-devnet");
const mobileNetworkMainnetCheck = document.getElementById("mobile-network-check-mainnet");
const mobileNetworkDevnetCheck = document.getElementById("mobile-network-check-devnet");
const mobileNetworkMainnetUnchecked = document.getElementById("mobile-network-unchecked-mainnet");
const mobileNetworkDevnetUnchecked = document.getElementById("mobile-network-unchecked-devnet");
const mobileNetworkMainnetButton = document.getElementById("mobile-network-mainnet");
const mobileNetworkDevnetButton = document.getElementById("mobile-network-devnet");
const feesButtonLabel = document.getElementById("header-fees-button-label");
const prioritySelect = document.getElementById("fees-priority-select");
const jitoSelect = document.getElementById("fees-jito-select");

const setFeesButtonLabel = (priority: string) => {
  if (!(feesButtonLabel instanceof HTMLElement)) return;
  const value = priority === "fast" || priority === "turbo" ? priority : "normal";
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  if (window.matchMedia("(max-width: 1023px)").matches) {
    feesButtonLabel.textContent = "Fees";
    return;
  }
  if (window.matchMedia("(max-width: 1199px)").matches) {
    feesButtonLabel.textContent = "Fees: Nrm";
    return;
  }
  feesButtonLabel.textContent = `Fees: ${label}`;
};

const hydrateStoredValue = (element: Element | null, key: string, fallback: string) => {
  if (!(element instanceof HTMLSelectElement)) return fallback;
  const storedValue = localStorage.getItem(key);
  if (storedValue && [...element.options].some((option) => option.value === storedValue)) {
    element.value = storedValue;
    return storedValue;
  }
  element.value = fallback;
  localStorage.setItem(key, fallback);
  return fallback;
};

const closeNetworkMenu = () => {
  if (!(networkMenu instanceof HTMLElement)) return;
  if (!(networkTrigger instanceof HTMLButtonElement)) return;
  networkMenu.classList.add("hidden");
  networkTrigger.setAttribute("aria-expanded", "false");
};

const openNetworkMenu = () => {
  if (!(networkMenu instanceof HTMLElement)) return;
  if (!(networkTrigger instanceof HTMLButtonElement)) return;
  networkMenu.classList.remove("hidden");
  networkTrigger.setAttribute("aria-expanded", "true");
};

type SetNetworkOptions = {
  emit?: boolean;
};

const setNetwork = (
  network: string,
  options: SetNetworkOptions = {},
) => {
  const value: SolanaNetworkValue = normalizeSolanaNetwork(network);
  document.documentElement.setAttribute("data-network", value);
  setStoredSolanaNetwork(value);

  if (networkCurrentLabel instanceof HTMLElement) {
    networkCurrentLabel.textContent = value === "devnet" ? "Devnet" : "Mainnet";
  }

  networkCurrentIcon?.setAttribute("data-network", value);
  const showMainnetIcon = value === "mainnet";
  const showDevnetIcon = value === "devnet";
  networkCurrentMainnetIcon?.classList.toggle("hidden", !showMainnetIcon);
  networkCurrentDevnetIcon?.classList.toggle("hidden", !showDevnetIcon);
  networkCurrentMainnetIcon?.toggleAttribute("hidden", !showMainnetIcon);
  networkCurrentDevnetIcon?.toggleAttribute("hidden", !showDevnetIcon);

  const networkOptions = document.querySelectorAll("[data-network-option]");
  networkOptions.forEach((option) => {
    if (!(option instanceof HTMLButtonElement)) return;
    const isSelected = option.dataset.networkOption === value;
    option.setAttribute("aria-checked", isSelected ? "true" : "false");
    option.dataset.selected = isSelected ? "true" : "false";
  });

  networkMainnetCheck?.classList.toggle("hidden", value !== "mainnet");
  networkDevnetCheck?.classList.toggle("hidden", value !== "devnet");
  mobileNetworkMainnetCheck?.classList.toggle("hidden", value !== "mainnet");
  mobileNetworkDevnetCheck?.classList.toggle("hidden", value !== "devnet");
  mobileNetworkMainnetUnchecked?.classList.toggle("hidden", value === "mainnet");
  mobileNetworkDevnetUnchecked?.classList.toggle("hidden", value === "devnet");
  if (mobileNetworkMainnetButton instanceof HTMLElement) {
    mobileNetworkMainnetButton.dataset.selected = value === "mainnet" ? "true" : "false";
  }
  if (mobileNetworkDevnetButton instanceof HTMLElement) {
    mobileNetworkDevnetButton.dataset.selected = value === "devnet" ? "true" : "false";
  }

  if (options.emit) {
    window.dispatchEvent(
      new CustomEvent("solana-network-change", {
        detail: { network: value },
      }),
    );
  }
};

setNetwork(getStoredSolanaNetwork());

networkTrigger?.addEventListener("click", () => {
  if (!(networkMenu instanceof HTMLElement)) return;
  const isOpen = !networkMenu.classList.contains("hidden");
  if (isOpen) {
    closeNetworkMenu();
    return;
  }
  openNetworkMenu();
});

document.querySelectorAll("[data-network-option]").forEach((option) => {
  option.addEventListener("click", () => {
    if (!(option instanceof HTMLButtonElement)) return;
    const next = option.dataset.networkOption === "devnet" ? "devnet" : "mainnet";
    setNetwork(next, { emit: true });
    closeNetworkMenu();
  });
});

mobileNetworkMainnetButton?.addEventListener("click", () => {
  setNetwork("mainnet", { emit: true });
});
mobileNetworkDevnetButton?.addEventListener("click", () => {
  setNetwork("devnet", { emit: true });
});

document.addEventListener("click", (event) => {
  if (!(networkPicker instanceof HTMLElement)) return;
  if (!networkPicker.contains(event.target as Node)) {
    closeNetworkMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNetworkMenu();
  }
});

if (prioritySelect instanceof HTMLSelectElement) {
  const initialPriority = hydrateStoredValue(prioritySelect, HEADER_PRIORITY_KEY, "normal");
  setFeesButtonLabel(initialPriority);
  prioritySelect.addEventListener("change", () => {
    localStorage.setItem(HEADER_PRIORITY_KEY, prioritySelect.value);
    setFeesButtonLabel(prioritySelect.value);
  });
}

window.addEventListener("resize", () => {
  if (!(prioritySelect instanceof HTMLSelectElement)) return;
  setFeesButtonLabel(prioritySelect.value);
});

if (jitoSelect instanceof HTMLSelectElement) {
  hydrateStoredValue(jitoSelect, HEADER_JITO_KEY, "5x");
  jitoSelect.addEventListener("change", () => {
    localStorage.setItem(HEADER_JITO_KEY, jitoSelect.value);
  });
}
