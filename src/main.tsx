// DEBUG: mostrar errores en pantalla (móvil)
window.addEventListener("error", (e) => {
  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;top:0;left:0;right:0;max-height:50vh;overflow:auto;z-index:999999;background:#111;color:#0f0;padding:12px;font:12px/1.4 monospace;white-space:pre-wrap;";
  div.textContent =
    "JS ERROR:\n" +
    (e.error?.stack || e.message || String(e));
  document.body.appendChild(div);
});

window.addEventListener("unhandledrejection", (e: any) => {
  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;max-height:50vh;overflow:auto;z-index:999999;background:#111;color:#f55;padding:12px;font:12px/1.4 monospace;white-space:pre-wrap;";
  div.textContent =
    "PROMISE REJECTION:\n" + String(e?.reason || e);
  document.body.appendChild(div);
});
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
