export function MD() {
  if (typeof window === "undefined") return false;
  if (navigator.userAgentData?.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)) {
    return true;
  }
  if (
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches
  ) {
    return true;
  }
  return false;
}