import { routes } from "../router";
import { RouteRecordRaw } from "vue-router";

interface RouteWithoutComponent
	extends Omit<RouteRecordRaw, "component" | "children"> {
	children?: RouteWithoutComponent[];
}

function withoutComponent(route: RouteRecordRaw): RouteWithoutComponent {
	const { component, ...rest } = route;
	return {
		...rest,
		children: route.children?.map(withoutComponent),
	};
}

const links = routes.map(withoutComponent);

export function useNavLinks() {
	return { links };
}
