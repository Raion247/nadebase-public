const GA_ID = "G-6V1TWZLHCH";

export function A() {
  if (typeof window === "undefined") return;

  if (window.gaLoaded) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });

    window.gaLoaded = true;
  };
}