
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
const CHEF_ICON_URL = "/assets/Chef.svg";

function ensureHeadBranding() {
  document.title = "TasteBuddy";

  const setMeta = (name: string, content: string) => {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  };

  const setLink = (rel: string, href: string, type?: string) => {
    let node = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", rel);
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
    if (type) node.setAttribute("type", type);
  };

  setMeta("theme-color", "#ff3a00");
  setMeta("apple-mobile-web-app-title", "TasteBuddy");
  setMeta("apple-mobile-web-app-capable", "yes");
  setLink("icon", CHEF_ICON_URL, "image/svg+xml");
  setLink("apple-touch-icon", CHEF_ICON_URL, "image/svg+xml");
}

ensureHeadBranding();
createRoot(document.getElementById("root")!).render(<App />);
  