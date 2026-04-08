import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import openapiPlugin from 'sveltekit-openapi-generator';

export default defineConfig({ plugins: [
    openapiPlugin({
        // OpenAPI info section
        info: {
            title: 'Hesperida API',
            version: '0.4.0',
            description: 'Web App Scanner'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Development' }
        ],
        // Path to shared schema definitions
        baseSchemasPath: 'src/lib/schemas.js',
        // Additional YAML files to include
        yamlFiles: ['src/lib/extra-specs.yaml'],
        // Path prefix for all routes
        prependPath: '',
        // Glob patterns to include
        include: ['src/routes/api/v1/**/{+server,+page.server}.{js,ts}'],
        // Glob patterns to exclude
        exclude: ['**/node_modules/**', '**/.svelte-kit/**'],
        // Whether to fail on JSDoc parsing errors
        failOnErrors: false,
        // Output path for the spec file during build
        outputPath: 'static/openapi.json',
        // Debounce delay in milliseconds for file watching
        debounceMs: 200
    }),
    tailwindcss(),
    sveltekit()
]});
