import { defineConfig } from 'vite';

export default defineConfig({
    // Base path matches the GitHub repo name
    base: '/MobileWebGame/',

    build: {
        // Output to 'docs' so GitHub Pages can serve from the docs/ folder
        outDir: 'docs',
        emptyOutDir: true,
    },
});
