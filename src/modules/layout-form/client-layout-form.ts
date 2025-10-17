import { submitForm } from "@/lib/client/form";
import { initIcons } from "@/lib/client/icons";
import { toast } from "@/lib/client/toast";
import { ClientModule } from "@/modules/client";
import { LayoutFormData } from "@/modules/layout-form/server-layout-form";
import z from "zod/v3";

export const clientLayoutForm: ClientModule<LayoutFormData> = {
	shortName: "layout-form",
	clientInit: async ({ data, element }) => {
		const form = element as HTMLFormElement;
		const modulesContainer = element.querySelector("#modules-container") as HTMLDivElement;
		const deleteModal = element.querySelector("#delete-module-modal") as HTMLDialogElement;
		const cancelDeleteBtn = element.querySelector("#cancel-delete-btn") as HTMLButtonElement;
		const confirmDeleteBtn = element.querySelector("#confirm-delete-btn") as HTMLButtonElement;
		const addModuleBtn = element.querySelector("#add-module-btn") as HTMLButtonElement;
		const newModuleSelect = element.querySelector("#new-module-select") as HTMLSelectElement;
		const deleteLayoutBtn = element.querySelector("#delete-layout-btn") as HTMLButtonElement;
		const deleteLayoutModal = element.querySelector("#delete-layout-modal") as HTMLDialogElement;
		const cancelDeleteLayoutBtn = element.querySelector(
			"#cancel-delete-layout-btn",
		) as HTMLButtonElement;
		const confirmDeleteLayoutBtn = element.querySelector(
			"#confirm-delete-layout-btn",
		) as HTMLButtonElement;

		let moduleToDelete: HTMLElement | null = null;
		let draggedModule: HTMLElement | null = null;

		// Remove skeleton classes
		const skeletonElements = element.querySelectorAll(".skeleton");
		skeletonElements.forEach((el) => {
			el.classList.remove("skeleton");
		});

		// Reorganize existing modules into rows based on their coordinates
		const reorganizeIntoRows = () => {
			// Get all module items (both standalone and in rows)
			const allModules = Array.from(
				modulesContainer.querySelectorAll(".module-item"),
			) as HTMLElement[];

			// Group modules by Y coordinate
			const modulesByY = new Map<number, HTMLElement[]>();
			allModules.forEach((module) => {
				const y = parseInt(module.dataset.y || "0");
				if (!modulesByY.has(y)) {
					modulesByY.set(y, []);
				}
				modulesByY.get(y)!.push(module);
			});

			// Sort by Y value
			const sortedYValues = Array.from(modulesByY.keys()).sort((a, b) => a - b);

			// Clear the container
			modulesContainer.innerHTML = "";

			// Rebuild the structure
			sortedYValues.forEach((y) => {
				const modules = modulesByY.get(y)!;
				// Sort modules by X within the same Y
				modules.sort((a, b) => {
					const aX = parseInt(a.dataset.x || "0");
					const bX = parseInt(b.dataset.x || "0");
					return aX - bX;
				});

				if (modules.length === 1) {
					// Single module - add directly to container
					modulesContainer.appendChild(modules[0]);
				} else {
					// Multiple modules - wrap in a flex-row container
					const rowContainer = document.createElement("div");
					rowContainer.className = "flex flex-row gap-4 w-full module-row";
					rowContainer.dataset.y = y.toString();

					modules.forEach((module) => {
						rowContainer.appendChild(module);
					});

					modulesContainer.appendChild(rowContainer);
				}
			});
		};

		// Add module functionality
		addModuleBtn.addEventListener("click", () => {
			const selectedOption = newModuleSelect.selectedOptions[0];
			if (!selectedOption || !selectedOption.value) {
				toast.error("Please select a module to add");
				return;
			}

			const moduleId = selectedOption.value;
			const moduleName = selectedOption.textContent || "Unknown Module";
			const moduleShortName = selectedOption.dataset.shortName || "";

			const tempId = `temp-${Date.now()}`;

			const existingModules = modulesContainer.querySelectorAll(".module-item");
			let maxY = -1;
			existingModules.forEach((mod) => {
				const y = parseInt(mod.getAttribute("data-y") || "0");
				if (y > maxY) maxY = y;
			});
			const nextY = maxY + 1;

			const moduleElement = document.createElement("div");
			moduleElement.className = "card bg-base-200 module-item";
			moduleElement.setAttribute("data-layout-module-id", tempId);
			moduleElement.setAttribute("data-module-id", moduleId);
			moduleElement.setAttribute("data-x", "0");
			moduleElement.setAttribute("data-y", nextY.toString());
			moduleElement.setAttribute("draggable", "true");

			moduleElement.innerHTML = `
				<div class="card-body gap-4">
					<div class="flex flex-row items-center gap-4 w-full justify-between">
						<div class="flex flex-row items-center gap-4">
							<i data-lucide="grip-vertical" class="w-5 h-5 cursor-move drag-handle"></i>
							<img src="/logo-sm.webp" alt="Module" class="w-8 h-8" />
							<h2 class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 m-0 p-0">${moduleName}</h2>
							<label class="input input-sm">
								<span class="label-text">X:</span>
								<input type="number" data-module-x="${tempId}" value="0" class="w-12 text-left ml-2" readonly />
							</label>
							<label class="input input-sm">
								<span class="label-text">Y:</span>
								<input type="number" data-module-y="${tempId}" value="${nextY}" class="w-12 text-left ml-2" readonly />
							</label>
						</div>
						<button type="button" class="btn btn-sm btn-error delete-module-btn" data-module-id="${tempId}">
							<i class="w-4 h-4" data-lucide="trash"></i>
						</button>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 bg-base-100 rounded" data-parameters-container="${tempId}">
						</div>
						<div class="flex flex-row gap-2 items-center">
							<select class="select select-sm flex-1" data-parameter-select="${tempId}">
								<option value="">Select parameter to add...</option>
								${data.allParameterTypes
									.filter((pt) => pt.key.startsWith(`${moduleShortName}.`))
									.map((pt) => `<option value="${pt.key}">${pt.key}</option>`)
									.join("")}
							</select>
							<button type="button" class="btn btn-sm btn-primary add-parameter-btn" data-layout-module-id="${tempId}">
								<i class="w-4 h-4" data-lucide="plus"></i>
								Add
							</button>
						</div>
					</div>
				</div>
				<div class="drop-zone drop-zone-top" data-position="top" data-target-module-id="${tempId}"></div>
				<div class="drop-zone drop-zone-bottom" data-position="bottom" data-target-module-id="${tempId}"></div>
				<div class="drop-zone drop-zone-left" data-position="left" data-target-module-id="${tempId}"></div>
				<div class="drop-zone drop-zone-right" data-position="right" data-target-module-id="${tempId}"></div>
			`;

			modulesContainer.appendChild(moduleElement);
			reorganizeIntoRows();
			attachModuleEventListeners();

			initIcons();

			newModuleSelect.value = "";
			toast.info("Module added");
		});

		const attachModuleEventListeners = () => {
			const deleteButtons = element.querySelectorAll(".delete-module-btn");
			deleteButtons.forEach((btn) => {
				btn.removeEventListener("click", handleDeleteClick);
				btn.addEventListener("click", handleDeleteClick);
			});

			const addParameterButtons = element.querySelectorAll(".add-parameter-btn");
			addParameterButtons.forEach((btn) => {
				btn.removeEventListener("click", handleAddParameter);
				btn.addEventListener("click", handleAddParameter);
			});

			const deleteParameterButtons = element.querySelectorAll(".delete-parameter-btn");
			deleteParameterButtons.forEach((btn) => {
				btn.removeEventListener("click", handleDeleteParameter);
				btn.addEventListener("click", handleDeleteParameter);
			});

			const moduleItems = element.querySelectorAll(".module-item");
			moduleItems.forEach((item) => {
				item.removeEventListener("dragstart", handleDragStart);
				item.removeEventListener("dragend", handleDragEnd);
				item.addEventListener("dragstart", handleDragStart);
				item.addEventListener("dragend", handleDragEnd);
			});

			const dropZones = element.querySelectorAll(".drop-zone");
			dropZones.forEach((zone) => {
				zone.removeEventListener("dragover", handleDragOver);
				zone.removeEventListener("dragleave", handleDragLeave);
				zone.removeEventListener("drop", handleDrop);
				zone.addEventListener("dragover", handleDragOver);
				zone.addEventListener("dragleave", handleDragLeave);
				zone.addEventListener("drop", handleDrop);
			});
		};

		const handleDeleteClick = (e: Event) => {
			const btn = e.currentTarget as HTMLButtonElement;
			const moduleId = btn.dataset.moduleId;
			moduleToDelete = element.querySelector(`[data-layout-module-id="${moduleId}"]`);
			if (moduleToDelete) {
				deleteModal.showModal();
			}
		};

		const handleAddParameter = (e: Event) => {
			const btn = e.currentTarget as HTMLButtonElement;
			const layoutModuleId = btn.dataset.layoutModuleId;
			const select = element.querySelector(
				`[data-parameter-select="${layoutModuleId}"]`,
			) as HTMLSelectElement;
			const parameterKey = select.value;

			if (!parameterKey) {
				toast.error("Please select a parameter to add");
				return;
			}

			const parameterType = data.allParameterTypes.find((pt) => pt.key === parameterKey);
			if (!parameterType) {
				toast.error("Parameter type not found");
				return;
			}

			const parametersContainer = element.querySelector(
				`[data-parameters-container="${layoutModuleId}"]`,
			) as HTMLDivElement;

			const parameterElement = document.createElement("div");
			parameterElement.className = "flex flex-row items-center gap-2 parameter-item";
			parameterElement.innerHTML = `
				<label class="flex-1 input input-sm flex flex-row items-center">
					<span class="label-text min-w-32">${parameterKey}</span>
					<input 
						type="${parameterType.type === "NUMBER" ? "number" : "text"}" 
						data-parameter-key="${parameterKey}" 
						data-layout-module-id="${layoutModuleId}" 
						value="" 
						class="flex-1 ml-2"
					/>
				</label>
				<button type="button" class="btn btn-xs btn-ghost delete-parameter-btn" data-parameter-key="${parameterKey}" data-layout-module-id="${layoutModuleId}">
					<i class="w-3 h-3" data-lucide="x"></i>
				</button>
			`;

			parametersContainer.appendChild(parameterElement);

			const selectedOption = select.querySelector(`option[value="${parameterKey}"]`);
			if (selectedOption) {
				selectedOption.remove();
			}

			select.value = "";
			attachModuleEventListeners();

			initIcons();

			toast.info("Parameter added");
		};

		const handleDeleteParameter = (e: Event) => {
			const btn = e.currentTarget as HTMLButtonElement;
			const parameterKey = btn.dataset.parameterKey;
			const layoutModuleId = btn.dataset.layoutModuleId;

			const parameterItem = btn.closest(".parameter-item");
			if (parameterItem) {
				parameterItem.remove();

				const select = element.querySelector(
					`[data-parameter-select="${layoutModuleId}"]`,
				) as HTMLSelectElement;
				const parameterType = data.allParameterTypes.find((pt) => pt.key === parameterKey);
				if (parameterType && select) {
					const option = document.createElement("option");
					option.value = parameterKey!;
					option.textContent = parameterKey!;
					select.appendChild(option);
				}

				toast.info("Parameter removed");
			}
		};

		const handleDragStart = (e: Event) => {
			const target = e.currentTarget as HTMLElement;
			draggedModule = target;
			target.classList.add("dragging");
			document.body.classList.add("dragging-module");
		};

		const handleDragEnd = (e: Event) => {
			const target = e.currentTarget as HTMLElement;
			target.classList.remove("dragging");
			draggedModule = null;
			document.body.classList.remove("dragging-module");

			const dropZones = element.querySelectorAll(".drop-zone");
			dropZones.forEach((zone) => {
				zone.classList.remove("drop-zone-active", "bg-primary/30");
			});
		};

		const handleDragOver = (e: Event) => {
			e.preventDefault();
			const target = e.currentTarget as HTMLElement;
			target.classList.add("drop-zone-active", "bg-primary/30");
		};

		const handleDragLeave = (e: Event) => {
			const target = e.currentTarget as HTMLElement;
			target.classList.remove("drop-zone-active", "bg-primary/30");
		};

		const handleDrop = (e: Event) => {
			e.preventDefault();
			const dropZone = e.currentTarget as HTMLElement;
			dropZone.classList.remove("drop-zone-active", "bg-primary/30");

			if (!draggedModule) return;

			const position = dropZone.dataset.position;
			const targetModuleId = dropZone.dataset.targetModuleId;
			const targetModule = element.querySelector(
				`[data-layout-module-id="${targetModuleId}"]`,
			) as HTMLElement;

			if (!targetModule || targetModule === draggedModule) return;

			// Insert the dragged module at the correct DOM position
			if (position === "top") {
				targetModule.parentNode?.insertBefore(draggedModule, targetModule);
			} else if (position === "bottom") {
				targetModule.parentNode?.insertBefore(draggedModule, targetModule.nextSibling);
			} else if (position === "left") {
				targetModule.parentNode?.insertBefore(draggedModule, targetModule);
			} else if (position === "right") {
				targetModule.parentNode?.insertBefore(draggedModule, targetModule.nextSibling);
			}

			// Recalculate all coordinates based on the new DOM order and position type
			recalculateCoordinates(position === "left" || position === "right");

			toast.info("Module repositioned");
		};

		const recalculateCoordinates = (isHorizontal: boolean = false) => {
			const moduleItems = Array.from(
				modulesContainer.querySelectorAll(".module-item"),
			) as HTMLElement[];

			// If the last drop was horizontal, we need to handle row logic
			// Otherwise, everything is in a single column (x=0)
			if (isHorizontal && draggedModule) {
				// Find the dragged module's index in the DOM
				const draggedIndex = moduleItems.indexOf(draggedModule);

				// Look for adjacent modules to determine if we're creating/joining a row
				const prevModule = moduleItems[draggedIndex - 1];
				const nextModule = moduleItems[draggedIndex + 1];

				if (prevModule) {
					const prevY = parseInt(prevModule.dataset.y || "0");
					const prevX = parseInt(prevModule.dataset.x || "0");

					// Place dragged module in the same row as previous module
					draggedModule.dataset.y = prevY.toString();
					draggedModule.dataset.x = (prevX + 1).toString();

					// Update the input fields
					const xInput = draggedModule.querySelector(
						`[data-module-x="${draggedModule.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					const yInput = draggedModule.querySelector(
						`[data-module-y="${draggedModule.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					if (xInput) xInput.value = draggedModule.dataset.x;
					if (yInput) yInput.value = draggedModule.dataset.y;

					// Recalculate remaining modules
					let currentY = prevY;
					for (let i = draggedIndex + 1; i < moduleItems.length; i++) {
						currentY++;
						moduleItems[i].dataset.x = "0";
						moduleItems[i].dataset.y = currentY.toString();

						const xInput = moduleItems[i].querySelector(
							`[data-module-x="${moduleItems[i].dataset.layoutModuleId}"]`,
						) as HTMLInputElement;
						const yInput = moduleItems[i].querySelector(
							`[data-module-y="${moduleItems[i].dataset.layoutModuleId}"]`,
						) as HTMLInputElement;
						if (xInput) xInput.value = "0";
						if (yInput) yInput.value = currentY.toString();
					}
				}
			} else {
				// Vertical arrangement - recalculate all Y values in sequence
				moduleItems.forEach((item, index) => {
					item.dataset.x = "0";
					item.dataset.y = index.toString();

					const xInput = item.querySelector(
						`[data-module-x="${item.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					const yInput = item.querySelector(
						`[data-module-y="${item.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					if (xInput) xInput.value = "0";
					if (yInput) yInput.value = index.toString();
				});
			}

			// After updating coordinates, reorganize into rows
			reorganizeIntoRows();
			// Reattach event listeners after DOM reorganization
			attachModuleEventListeners();
		};

		cancelDeleteBtn.addEventListener("click", () => {
			deleteModal.close();
			moduleToDelete = null;
		});

		confirmDeleteBtn.addEventListener("click", () => {
			if (moduleToDelete) {
				moduleToDelete.remove();

				// Recalculate coordinates for remaining modules
				const moduleItems = Array.from(
					modulesContainer.querySelectorAll(".module-item"),
				) as HTMLElement[];

				moduleItems.forEach((item, index) => {
					item.dataset.x = "0";
					item.dataset.y = index.toString();

					const xInput = item.querySelector(
						`[data-module-x="${item.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					const yInput = item.querySelector(
						`[data-module-y="${item.dataset.layoutModuleId}"]`,
					) as HTMLInputElement;
					if (xInput) xInput.value = "0";
					if (yInput) yInput.value = index.toString();
				});

				reorganizeIntoRows();
				attachModuleEventListeners();
				toast.info("Module removed");
				deleteModal.close();
				moduleToDelete = null;
			}
		});

		// Delete layout functionality
		deleteLayoutBtn.addEventListener("click", () => {
			deleteLayoutModal.showModal();
		});

		cancelDeleteLayoutBtn?.addEventListener("click", () => {
			deleteLayoutModal.close();
		});

		confirmDeleteLayoutBtn?.addEventListener("click", async () => {
			const layoutId = (form.querySelector("input[name='layoutId']") as HTMLInputElement)?.value;

			if (!layoutId) {
				toast.error("No layout ID found");
				deleteLayoutModal.close();
				return;
			}

			await submitForm({
				element,
				url: `/api/layouts/${layoutId}`,
				method: "DELETE",
				redirectUrl: () => "/admin/layouts",
			});

			deleteLayoutModal.close();
		});
		form.addEventListener("submit", async (e) => {
			e.preventDefault();

			const layoutId =
				(form.querySelector("input[name='layoutId']") as HTMLInputElement)?.value || undefined;
			const title = (form.querySelector("input[name='title']") as HTMLInputElement).value;
			const description = (form.querySelector("input[name='description']") as HTMLInputElement)
				.value;
			const isActive = (form.querySelector("input[name='isActive']") as HTMLInputElement).checked;

			const moduleItems = Array.from(
				modulesContainer.querySelectorAll(".module-item"),
			) as HTMLElement[];
			const modules = moduleItems.map((item) => {
				const layoutModuleId = item.dataset.layoutModuleId!;
				const moduleId = item.dataset.moduleId!;
				const x = parseInt(item.dataset.x || "0");
				const y = parseInt(item.dataset.y || "0");

				const parameterInputs = item.querySelectorAll(
					`input[data-layout-module-id="${layoutModuleId}"][data-parameter-key]`,
				) as NodeListOf<HTMLInputElement>;
				const parameters = Array.from(parameterInputs).map((input) => ({
					key: input.dataset.parameterKey!,
					value: input.value,
				}));

				return {
					id: moduleId,
					x,
					y,
					parameters,
				};
			});

			await submitForm({
				element,
				url: `/api/layouts${layoutId ? `/${layoutId}` : ""}`,
				method: layoutId ? "PUT" : "POST",
				data: {
					title,
					description,
					isActive,
					modules,
				},
				schema: z.object({
					title: z.string().min(3).max(32),
					description: z.string().max(128).optional(),
					isActive: z.boolean(),
					modules: z.array(
						z.object({
							id: z.string(),
							x: z.number(),
							y: z.number(),
							parameters: z.array(
								z.object({
									key: z.string(),
									value: z.string(),
								}),
							),
						}),
					),
				}),
			});
		});

		// Organize existing modules into rows on initial load
		reorganizeIntoRows();
		attachModuleEventListeners();
	},
};
