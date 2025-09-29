import { initIcons } from "@/lib/client/icons";
import { toast } from "@/lib/client/toast";
import { ClientModule, clientModules } from "@/modules/client";
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

export function lockModuleButtons(element: HTMLElement) {
	const moduleButtons = element.querySelectorAll(
		"button, input[type='submit']",
	) as unknown as HTMLButtonElement[];
	if (moduleButtons) {
		moduleButtons.forEach((button) => {
			button.disabled = true;
			button.classList.add("btn-disabled");
			const loadingIcon = document.createElement("span");
			loadingIcon.classList.add("loading", "loading-spinner", "loading-md");
			button.appendChild(loadingIcon);
		});
	}
}

export function unlockModuleButtons(element: HTMLElement) {
	const moduleButtons = element.querySelectorAll(
		"button, input[type='submit']",
	) as unknown as HTMLButtonElement[];
	if (moduleButtons) {
		moduleButtons.forEach((button) => {
			button.disabled = false;
			button.classList.remove("btn-disabled");
			button.querySelector("span.loading")?.remove();
		});
	}
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
	if (!response.ok) {
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
	const response = await fetch(`api/layout-modules?elementIds=${elementId}`);
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
			if (render) {
				module.outerHTML = render;
			}
		} catch (error) {
			toast.error(`Error rendering module ${module.dataset.module}: ${error}`);
		}
	}
	initIcons();
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
	await renderModules();
	attachModuleInitializers();
});
