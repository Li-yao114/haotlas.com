const AMAP_KEY = "043da52948ddaac5424e60bd88957bfc";

let loadingPromise = null;

export function loadAmap() {
  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }

  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.async = true;
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap);
      } else {
        reject(new Error("AMap loaded but window.AMap is undefined"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load AMap script"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
