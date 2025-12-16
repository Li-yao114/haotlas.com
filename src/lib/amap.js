const AMAP_KEY = "043da52948ddaac5424e60bd88957bfc";
const AMAP_SECURITY_JS_CODE = "f69ef79a790dd0251a97f9866110842b";

let amapPromise = null;

// 统一加载 AMap JS SDK（返回 Promise<AMap>）
export function loadAmap() {
  if (amapPromise) return amapPromise;

  amapPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window 不存在"));
      return;
    }

    if (window.AMap) {
      resolve(window.AMap);
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_JS_CODE,
    };

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.async = true;

    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap);
      } else {
        reject(new Error("AMap SDK 加载失败"));
      }
    };

    script.onerror = (e) => {
      reject(e);
    };

    document.head.appendChild(script);
  });

  return amapPromise;
}
