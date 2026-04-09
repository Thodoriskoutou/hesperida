<script lang="ts">
import { onMount } from 'svelte';
import { page } from '$app/state';
import { dev } from '$app/environment';
import 'swagger-ui-dist/swagger-ui.css';

let containerElement: HTMLElement | undefined;
let spec: any = $state();

// Get the current server URL reactively
let currentOrigin = $derived(page.url.origin);

// Create a modified spec with the current server URL
let specWithServer = $derived({
    ...spec,
    servers: [
        {
            url: currentOrigin,
            description: dev ? 'Development server' : 'Production server'
        }
    ]
});

async function initializeSwaggerUI() {
    if (!containerElement) return;

    try {
        // Attempt to load a virtual spec module (Vite plugin) first
        try {
            // @ts-ignore - virtual import may not exist in all environments
            const virtualSpec = await import('virtual:openapi-spec');
            spec = virtualSpec?.default ?? virtualSpec;
        } catch (e) {
            // Fallback: fetch the openapi spec from the dev middleware
            try {
                const res = await fetch('/openapi-spec.json');
                if (res.ok) spec = await res.json();
                else spec = { openapi: '3.0.0', info: { title: 'API' }, paths: {} };
            } catch (fetchErr) {
                spec = { openapi: '3.0.0', info: { title: 'API' }, paths: {} };
            }
        }

        // @ts-ignore - swagger-ui-dist doesn't have types
        const { SwaggerUIBundle, SwaggerUIStandalonePreset } = await import('swagger-ui-dist');

        SwaggerUIBundle({
            spec: specWithServer,
            domNode: containerElement,
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset]
        });
    } catch (error) {
        console.error('Failed to initialize Swagger UI:', error);
    }
}

onMount(() => {
    initializeSwaggerUI();
});
</script>

<svelte:head>
	<title>Hesperida API Documentation</title>
</svelte:head>

<div class="swagger-container">
	<div id="swagger-ui-container" bind:this="{containerElement}"></div>
</div>

<style>
.swagger-container {
    min-height: 600px;
}

:global {
    .swagger-ui .info {
        margin: 1rem 0;
    }
    .swagger-ui .topbar, .swagger-ui .scheme-container {
        display: none;
    }
}

@media (prefers-color-scheme: dark) {
    :global {
        .swagger-ui, .swagger-ui .scheme-container {
            background: #333;
        }
        .swagger-ui, .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3, .swagger-ui .info h4, .swagger-ui .info h5, .swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info table, .swagger-ui .opblock-tag, .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated, .swagger-ui .opblock .opblock-summary-description, .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p, .swagger-ui table thead tr td, .swagger-ui table thead tr th, .swagger-ui .response-col_status, .swagger-ui .response-col_links, .swagger-ui .tab li, .swagger-ui .model {
            color: white!important;
        }
    }
}

</style>