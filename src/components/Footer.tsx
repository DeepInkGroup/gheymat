export default function Footer() {
  return (
    <footer className="hide-standalone safe-bottom grid grid-cols-3 items-center gap-3 px-4 pb-4 pt-2 text-center text-xs text-muted">
      <span className="num justify-self-start">V 1.2.5</span>
      <div className="col-start-2 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/DeepInkGroup"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="DeepInk Group on GitHub"
            className="text-muted transition-colors hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.87 10.93c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.07.78 2.15v3.19c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </a>
          <a
            href="https://t.me/DeepInkGroup"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="DeepInk Group on Telegram"
            className="text-muted transition-colors hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M23.05 2.1 19.6 21.16c-.26 1.15-.94 1.44-1.9.9l-5.26-3.88-2.54 2.45c-.28.28-.52.52-1.06.52l.38-5.4L19 6.1c.44-.39-.1-.6-.68-.22L6.7 13.2l-5.3-1.66c-1.15-.36-1.17-1.15.24-1.7L21.6.87c.96-.36 1.8.22 1.45 1.23Z" />
            </svg>
          </a>
        </div>
        <div>DeepInk Group - Gheymat</div>
      </div>
      <span className="col-start-3 justify-self-end">Just Know ...!</span>
    </footer>
  );
}
