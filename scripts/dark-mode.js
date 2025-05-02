function toggleDarkMode() {
  const html = document.documentElement;
  if (html.classList.contains('color-mode-dark')) {
	html.classList.remove('color-mode-dark');
	html.classList.add('color-mode-light');
  } else {
	html.classList.remove('color-mode-light');
	html.classList.add('color-mode-dark');
  }
}