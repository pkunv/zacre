import { executeModuleAction } from "@/client";
import { toast } from "@/lib/client/toast";
import { validateFormInputs } from "@/lib/client/validate-form";
import { ClientModule } from "@/modules/client";
import { PagesFormData } from "@/modules/pages-form/server-pages-form";

export const clientPagesForm: ClientModule<PagesFormData> = {
	shortName: "pages-form",
	clientInit: async ({ data, element }) => {
		const form = element as HTMLFormElement;
		const selectLayoutBtn = element.querySelector("#select-layout-btn") as HTMLButtonElement;
		const selectedLayoutText = element.querySelector("#selected-layout-text") as HTMLSpanElement;
		const layoutIdInput = element.querySelector("#layout-id-input") as HTMLInputElement;
		const layoutSelectionModal = element.querySelector(
			"#layout-selection-modal",
		) as HTMLDialogElement;
		const cancelLayoutSelectionBtn = element.querySelector(
			"#cancel-layout-selection-btn",
		) as HTMLButtonElement;
		const layoutSearchInput = element.querySelector("#layout-search-input") as HTMLInputElement;
		const layoutsList = element.querySelector("#layouts-list") as HTMLDivElement;
		const deletePageBtn = element.querySelector("#delete-page-btn") as HTMLButtonElement;
		const deletePageModal = element.querySelector("#delete-page-modal") as HTMLDialogElement;
		const cancelDeletePageBtn = element.querySelector(
			"#cancel-delete-page-btn",
		) as HTMLButtonElement;
		const confirmDeletePageBtn = element.querySelector(
			"#confirm-delete-page-btn",
		) as HTMLButtonElement;

		// Remove skeleton classes
		const skeletonElements = element.querySelectorAll(".skeleton");
		skeletonElements.forEach((el) => {
			el.classList.remove("skeleton");
		});

		// Open layout selection modal
		selectLayoutBtn.addEventListener("click", () => {
			layoutSelectionModal.showModal();
		});

		// Cancel layout selection
		cancelLayoutSelectionBtn.addEventListener("click", () => {
			layoutSelectionModal.close();
		});

		// Layout search functionality
		layoutSearchInput.addEventListener("input", () => {
			const searchTerm = layoutSearchInput.value.toLowerCase();
			const layoutItems = layoutsList.querySelectorAll(".layout-item") as NodeListOf<HTMLElement>;

			layoutItems.forEach((item) => {
				const title = item.dataset.layoutTitle?.toLowerCase() || "";
				const description = item.dataset.layoutDescription?.toLowerCase() || "";

				if (title.includes(searchTerm) || description.includes(searchTerm)) {
					item.style.display = "";
				} else {
					item.style.display = "none";
				}
			});
		});

		// Handle layout selection
		const selectLayoutButtons = element.querySelectorAll(".select-layout-btn");
		selectLayoutButtons.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const button = e.currentTarget as HTMLButtonElement;
				const layoutId = button.dataset.layoutId;
				const layoutTitle = button.dataset.layoutTitle;

				if (layoutId && layoutTitle) {
					layoutIdInput.value = layoutId;
					selectedLayoutText.textContent = layoutTitle;
					selectLayoutBtn.dataset.layoutName = layoutTitle;
					layoutSelectionModal.close();
					toast.info(`Layout selected: ${layoutTitle}`);
				}
			});
		});

		// Delete page functionality
		deletePageBtn.addEventListener("click", () => {
			if (!data.page) {
				toast.error("Cannot delete a page that hasn't been created yet");
				return;
			}
			deletePageModal.showModal();
		});

		cancelDeletePageBtn.addEventListener("click", () => {
			deletePageModal.close();
		});

		confirmDeletePageBtn.addEventListener("click", async () => {
			const pageId = (form.querySelector("input[name='pageId']") as HTMLInputElement)?.value;

			if (!pageId) {
				toast.error("No page ID found");
				deletePageModal.close();
				return;
			}

			await executeModuleAction({
				element,
				elementId: element.dataset.elementId!,
				data: {
					pageId,
					title: "",
					description: "",
					url: "",
					layoutId: "",
					isActive: false,
					method: "DELETE",
				},
			});

			deletePageModal.close();
		});

		// Form submission
		form.addEventListener("submit", async (e) => {
			e.preventDefault();

			const pageId =
				(form.querySelector("input[name='pageId']") as HTMLInputElement)?.value || undefined;
			const title = (form.querySelector("input[name='title']") as HTMLInputElement).value;
			const description = (form.querySelector("input[name='description']") as HTMLInputElement)
				.value;
			const url = (form.querySelector("input[name='url']") as HTMLInputElement).value;
			const layoutId = (form.querySelector("input[name='layoutId']") as HTMLInputElement).value;
			const isActive = (form.querySelector("input[name='isActive']") as HTMLInputElement).checked;
			const assignedFeature = (
				form.querySelector("select[name='assignedFeature']") as HTMLSelectElement
			).value;

			// Validate form inputs
			if (
				!validateFormInputs({
					form,
					inputs: [
						{
							element: form.querySelector("input[name='title']") as HTMLInputElement,
							isRequired: true,
							minLength: 3,
							maxLength: 128,
						},
						{
							element: form.querySelector("input[name='description']") as HTMLInputElement,
							isRequired: false,
							maxLength: 256,
						},
						{
							element: form.querySelector("input[name='url']") as HTMLInputElement,
							isRequired: true,
							minLength: 1,
							maxLength: 256,
						},
					],
				})
			) {
				return;
			}

			// Validate URL starts with /
			if (!url.startsWith("/")) {
				toast.error("URL must start with /");
				return;
			}

			// Validate layout is selected
			if (!layoutId) {
				toast.error("Please select a layout");
				return;
			}

			await executeModuleAction({
				element,
				elementId: element.dataset.elementId!,
				data: {
					pageId,
					title,
					description,
					url,
					layoutId,
					isActive,
					assignedFeature: assignedFeature || undefined,
					method: pageId ? "UPDATE" : "CREATE",
				},
			});
		});
	},
};
