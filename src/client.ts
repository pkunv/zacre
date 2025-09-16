import { initIcons } from "@/lib/client/icons";
import { ClientModule, clientModules } from "@/modules/client";

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
			if (clientModule.hasNoServerData) {
				modulesWithoutServerData.push({ element: module as HTMLElement, clientModule });
			} else {
				modulesNeedingData.push({ elementId, element: module as HTMLElement, clientModule });
			}
		}
	}

	// Initialize modules without server data immediately
	modulesWithoutServerData.forEach(({ element, clientModule }) => {
		if (clientModule.clientInit) {
			clientModule.clientInit({
				element,
				data: undefined,
			});
		}
	});

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
						clientModule.clientInit({
							element,
							data,
						});
					}
				} catch (moduleError) {
					console.error(`Error initializing module ${elementId}:`, moduleError);
					// Initialize without data as fallback
					if (clientModule.clientInit) {
						clientModule.clientInit({
							element,
							data: undefined,
						});
					}
				}
			}
		}
	}
}

window.addEventListener("DOMContentLoaded", () => {
	initIcons();
	attachModuleInitializers();
});
