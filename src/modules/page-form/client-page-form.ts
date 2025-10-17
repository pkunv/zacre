import { submitForm } from "@/lib/client/form";
import { toast } from "@/lib/client/toast";
import { Page } from "@/lib/server/pages/get";
import { ClientModule } from "@/modules/client";
import { PageFormData } from "@/modules/page-form/server-page-form";
import z from "zod/v3";

export const clientPageForm: ClientModule<PageFormData> = {
	shortName: "page-form",
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
		const deletePageModal = document.querySelector("#delete-page-modal") as HTMLDialogElement;
		const cancelDeletePageBtn = element.querySelector(
			"#cancel-delete-page-btn",
		) as HTMLButtonElement;
		const confirmDeletePageBtn = document.querySelector(
			"#confirm-delete-page-btn",
		) as HTMLButtonElement;

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
				console.log("click");
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
			const pageId = (form.querySelector("input[name='pageId']") as HTMLInputElement)?.value;
			if (!pageId) {
				toast.error("Cannot delete a page that hasn't been created yet");
				return;
			}
			deletePageModal.showModal();
		});

		cancelDeletePageBtn?.addEventListener("click", () => {
			deletePageModal.close();
		});

		confirmDeletePageBtn?.addEventListener("click", async () => {
			const pageId = (form.querySelector("input[name='pageId']") as HTMLInputElement)?.value;

			if (!pageId) {
				toast.error("No page ID found");
				deletePageModal.close();
				return;
			}

			await submitForm({
				element,
				url: `/api/pages/${pageId}`,
				method: "DELETE",
				redirectUrl: () => "/admin/pages",
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

			await submitForm({
				element,
				url: `/api/pages${pageId ? `/${pageId}` : ""}`,
				method: pageId ? "PUT" : "POST",
				data: {
					title,
					description,
					url,
					layoutId,
					isActive,
					assignedFeature: assignedFeature === "" ? undefined : assignedFeature || undefined,
				},
				redirectUrl: (responseData) => {
					const item = responseData.item as Page | null;
					return item ? `/admin/pages/${item.id}` : `/admin/pages`;
				},
				schema: z.object({
					title: z.string().min(3).max(128),
					description: z.string().max(256).optional(),
					url: z
						.string()
						.min(1)
						.max(256)
						.regex(/^[/].*/, { message: "URL must start with a slash" }),
					layoutId: z.string({ message: "Layout is required" }),
					isActive: z.boolean(),
					assignedFeature: z.string().optional(),
				}),
			});

			return;
		});
	},
};
