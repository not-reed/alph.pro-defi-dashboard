import { createRouter, createWebHistory } from "vue-router";

const Home = { template: "<div>Home</div>" };
const About = { template: "<div>About</div>" };

const routes = [
	{ path: "/", component: Home },
	{ path: "/about", component: About },
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});
