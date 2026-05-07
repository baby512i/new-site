const feesDialog = document.getElementById("header-fees-dialog");
const feesOpenButton = document.getElementById("header-fees-button");
const feesCloseButton = document.getElementById("header-fees-close");
const proDialog = document.getElementById("header-pro-dialog");
const proOpenButton = document.getElementById("header-pro-button");
const proCloseButton = document.getElementById("header-pro-close");
const mobileSettingsDialog = document.getElementById("mobile-header-settings-dialog");
const mobileSettingsOpenButton = document.getElementById("mobile-header-settings-button");
const mobileSettingsCloseButton = document.getElementById("mobile-header-settings-close");
const mobileOpenFeesButton = document.getElementById("mobile-open-fees-button");
const mobileOpenProButton = document.getElementById("mobile-open-pro-button");

const openDialog = (dialogElement: Element | null) => {
  if (dialogElement instanceof HTMLDialogElement) {
    dialogElement.showModal();
  }
};

const closeDialog = (dialogElement: Element | null) => {
  if (dialogElement instanceof HTMLDialogElement && dialogElement.open) {
    dialogElement.close();
  }
};

feesOpenButton?.addEventListener("click", () => openDialog(feesDialog));
feesCloseButton?.addEventListener("click", () => closeDialog(feesDialog));
feesDialog?.addEventListener("click", (event) => {
  if (event.target === feesDialog) {
    closeDialog(feesDialog);
  }
});

proOpenButton?.addEventListener("click", () => openDialog(proDialog));
proCloseButton?.addEventListener("click", () => closeDialog(proDialog));
proDialog?.addEventListener("click", (event) => {
  if (event.target === proDialog) {
    closeDialog(proDialog);
  }
});

mobileSettingsOpenButton?.addEventListener("click", () => openDialog(mobileSettingsDialog));
mobileSettingsCloseButton?.addEventListener("click", () => closeDialog(mobileSettingsDialog));
mobileSettingsDialog?.addEventListener("click", (event) => {
  if (event.target === mobileSettingsDialog) {
    closeDialog(mobileSettingsDialog);
  }
});

mobileOpenFeesButton?.addEventListener("click", () => {
  closeDialog(mobileSettingsDialog);
  openDialog(feesDialog);
});

mobileOpenProButton?.addEventListener("click", () => {
  closeDialog(mobileSettingsDialog);
  openDialog(proDialog);
});
