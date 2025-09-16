import { H3 } from "@/components/modules-ui/typography";

export function LayoutElementError({ elementName, id }: { elementName?: string; id?: string }) {
	return (
		<div class="w-full h-full flex flex-col justify-center items-center text-center">
			<i data-lucide="triangle-alert" class="w-6 h-6"></i>
			<H3>{`Error: Module ${elementName || ""} cannot be loaded (ID: ${id || ""})`}</H3>
		</div>
	);
}
