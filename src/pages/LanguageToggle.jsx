import React from "react";

const LANGUAGES = [
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageToggle() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="language-switcher">
      <button
        type="button"
        className="language-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="language-icon">🇨🇳</span>
      </button>

      {open && (
        <div className="language-menu">
          {LANGUAGES.map((lang) => (
            <button key={lang.code} className="language-item">
              <span className="language-flag">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
