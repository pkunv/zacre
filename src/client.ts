import { initIcons } from "@/lib/client/icons";
import { toast } from "@/lib/client/toast";
import { lockModuleButtons, unlockModuleButtons } from "@/lib/client/utils";
import { ClientModule, clientModules } from "@/modules/client";
import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

// Global storage for module loaders (loading states)
const moduleLoaders = new Map<string, string>();

/**
 * Store module loaders before they are swapped with actual renders
 * This allows us to show loading states when re-rendering modules
 */
function storeModuleLoaders() {
	const modules = Array.from(document.querySelectorAll("[data-element-id]")) as HTMLDivElement[];
	for (const module of modules) {
		if (!module.dataset.elementId) continue;
		if (module.dataset.isLoaderSwappable === "false") continue;
		// Store the loader HTML
		moduleLoaders.set(module.dataset.elementId, module.outerHTML);
	}
}

/**
 * Utility function for debouncing input changes
 */
function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export async function fetchModuleRender(elementId: string) {
	const response = await fetch(`/api/layout-modules/${elementId}`);
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw new Error("Failed to fetch module render: " + response.statusText);
	}
	return await response.text();
}

export async function executeModuleAction({
	element,
	elementId,
	data,
	lockButtons = true,
}: {
	element: HTMLElement;
	elementId: string;
	data?: unknown;
	lockButtons?: boolean;
}) {
	if (lockButtons) {
		lockModuleButtons(element);
	}
	const response = await fetch(`/api/layout-modules/${elementId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: data ? JSON.stringify(data) : undefined,
	});
	if (lockButtons) {
		unlockModuleButtons(element);
	}
	if (!response.ok && response.status !== 302) {
		const result = await response.json();
		toast.error(result.message);
		return result;
	}
	const responseData = await response.json();
	if (responseData.status === "redirect") {
		toast.success(responseData.message || "Redirecting...");
		setTimeout(() => {
			window.location.href = responseData.url;
		}, 650);
		return responseData;
	}
	return responseData;
}

export async function fetchModuleData(elementId: string) {
	const response = await fetch(`/api/layout-modules?elementIds=${elementId}`);
	return await response.json();
}

export async function fetchBatchModuleData(
	elementIds: string[],
): Promise<{ id: string; data: unknown }[]> {
	const params = new URLSearchParams();
	elementIds.forEach((id) => params.append("elementIds", id.toString()));

	const response = await fetch(`/api/layout-modules?${params.toString()}`);
	const result = await response.json();

	if (result.status === "success") {
		return result.items;
	} else {
		throw new Error(`Batch fetch failed: ${result.message || "Unknown error"}`);
	}
}

export async function renderModules() {
	const modules = Array.from(document.querySelectorAll("[data-element-id]")) as HTMLDivElement[];
	for (const module of modules) {
		if (!module.dataset.elementId) continue;
		if (module.dataset.isLoaderSwappable === "false") continue;
		try {
			const render = await fetchModuleRender(module.dataset.elementId);
			if (!render) {
				throw new Error("Failed to fetch module render");
			}
			module.outerHTML = render;
		} catch (error) {
			toast.error(`Error rendering module ${module.dataset.module}: ${error}`);
		}
	}
	initIcons();
}

export async function renderModule(
	elementId: string,
	preserveInputValues: Record<string, string> = {},
) {
	const module = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLDivElement;
	if (!module.dataset.elementId) return;
	if (module.dataset.isLoaderSwappable === "false") return;
	try {
		const render = await fetchModuleRender(module.dataset.elementId);
		if (!render) {
			throw new Error("Failed to fetch module render");
		}
		module.outerHTML = render;

		// Restore input values after rendering
		if (Object.keys(preserveInputValues).length > 0) {
			const newModule = document.querySelector(
				`[data-element-id="${elementId}"]`,
			) as HTMLDivElement;
			if (newModule) {
				for (const [name, value] of Object.entries(preserveInputValues)) {
					const input = newModule.querySelector(`input[name="${name}"]`) as HTMLInputElement;
					if (input) {
						input.value = value;
					}
				}
			}
		}
	} catch (error) {
		toast.error(`Error rendering module ${module.dataset.module}: ${error}`);
	}
	initIcons();
}

/**
 * Handle debounced search input
 * Updates URL, shows loader, re-renders module, and restores input value
 */
async function handleDebouncedSearch(input: HTMLInputElement) {
	const inputName = input.name;
	const inputValue = input.value;

	// Find the parent module element
	const moduleElement = input.closest("[data-element-id]") as HTMLDivElement;
	if (!moduleElement || !moduleElement.dataset.elementId) {
		console.error("Could not find parent module for debounced input");
		return;
	}

	const elementId = moduleElement.dataset.elementId;

	// 1. Update URL with new query parameter
	const url = new URL(window.location.href);
	if (inputValue.trim()) {
		url.searchParams.set(inputName, inputValue);
	} else {
		url.searchParams.delete(inputName);
	}
	window.history.pushState({}, "", url.toString());

	// 2. Swap module with loader
	const loaderHTML = moduleLoaders.get(elementId);
	if (loaderHTML) {
		moduleElement.outerHTML = loaderHTML;
	}

	// 3. Render the module with new data
	await renderModule(elementId, { [inputName]: inputValue });

	// 4. Re-attach debounce handlers after module re-render
	attachDebounceHandlers();
}

/**
 * Populate inputs with values from URL query parameters
 * Called on page load to restore search state
 */
function populateInputsFromURL() {
	const url = new URL(window.location.href);
	const searchParams = url.searchParams;

	// Find all inputs with data-debounce="true"
	const debouncedInputs = Array.from(
		document.querySelectorAll('input[data-debounce="true"]'),
	) as HTMLInputElement[];

	for (const input of debouncedInputs) {
		// Check if URL has a parameter matching this input's name
		const paramValue = searchParams.get(input.name);
		if (paramValue !== null) {
			input.value = paramValue;
		}
	}
}

/**
 * Attach debounce handlers to all inputs with data-debounce="true"
 */
function attachDebounceHandlers() {
	const debouncedInputs = Array.from(
		document.querySelectorAll('input[data-debounce="true"]'),
	) as HTMLInputElement[];

	for (const input of debouncedInputs) {
		// Skip if already has handler attached
		if (input.dataset.debounceAttached === "true") continue;

		// Get debounce timeout from attribute or use default (1000ms)
		const timeout = input.dataset.debounceTimeout ? parseInt(input.dataset.debounceTimeout) : 1000;

		// Create debounced handler
		const debouncedHandler = debounce(() => {
			handleDebouncedSearch(input);
		}, timeout);

		// Attach input event listener
		input.addEventListener("input", debouncedHandler);

		// Mark as attached to avoid duplicate handlers
		input.dataset.debounceAttached = "true";
	}
}

export async function attachModuleInitializers() {
	const modules = Array.from(document.querySelectorAll("[data-module]")) as HTMLDivElement[];

	// Separate modules that need initialization with server data from those that don't
	const modulesNeedingData: {
		elementId: string;
		element: HTMLElement;
		clientModule: ClientModule<any>;
	}[] = [];
	const modulesWithoutServerData: { element: HTMLElement; clientModule: ClientModule<any> }[] = [];

	for (const module of modules) {
		if (!module.dataset.elementId) continue;
		const elementId = module.dataset.elementId;
		const clientModule = clientModules.find((m) => m.shortName === module.dataset.module);

		if (clientModule) {
			if (clientModule.hasNoServerData === undefined || clientModule.hasNoServerData === false) {
				modulesNeedingData.push({ elementId, element: module as HTMLElement, clientModule });
			} else {
				modulesWithoutServerData.push({ element: module as HTMLElement, clientModule });
			}
		}
	}

	// initialize modules without a need of server data request
	for (const { element, clientModule } of modulesWithoutServerData) {
		if (clientModule.clientInit) {
			await clientModule.clientInit({
				element,
				data: undefined,
			});
		}
	}

	// Batch fetch data for modules that need it
	if (modulesNeedingData.length > 0) {
		try {
			const elementIds = modulesNeedingData.map((m) => m.elementId);
			const batchData = await fetchBatchModuleData(elementIds);

			// Initialize each module with its corresponding data
			modulesNeedingData.forEach(({ elementId, element, clientModule }) => {
				const moduleData = batchData.find((item) => item.id === elementId);
				if (clientModule.clientInit) {
					clientModule.clientInit({
						element,
						data: moduleData?.data,
					});
				}
			});
		} catch (error) {
			console.error("Error in batch initialization:", error);

			// Fallback: initialize each module individually
			for (const { elementId, element, clientModule } of modulesNeedingData) {
				try {
					const data = await fetchModuleData(elementId);
					if (clientModule.clientInit) {
						await clientModule.clientInit({
							element,
							data,
						});
					}
				} catch (moduleError) {
					toast.error(`Error initializing module ${elementId}: ${moduleError}`);
					// Initialize without data as fallback
					if (clientModule.clientInit) {
						await clientModule.clientInit({
							element,
							data: undefined,
						});
					}
				}
			}
		}
	}
}

window.addEventListener("DOMContentLoaded", async () => {
	initIcons();
	// Store loaders before they are swapped with actual renders
	storeModuleLoaders();
	await renderModules();
	attachModuleInitializers();
	// Populate inputs from URL query parameters
	populateInputsFromURL();
	// Attach debounce handlers to search inputs
	attachDebounceHandlers();
});
