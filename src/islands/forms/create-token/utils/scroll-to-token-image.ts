export const TOKEN_IMAGE_FIELD_ID = "tokenImage";

export function scrollToTokenImage(): boolean {
  const root = document.getElementById(TOKEN_IMAGE_FIELD_ID);
  if (!root) return false;

  root.scrollIntoView({ behavior: "smooth", block: "center" });

  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  input?.focus({ preventScroll: true });

  return true;
}
