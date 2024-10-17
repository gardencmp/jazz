import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/HomeView.vue";
import Chat from "./views/ChatView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "Home",
            component: Home,
        },
        { path: "/chat/:chatId", name: "Chat", component: Chat, props: true },
    ],
});

export default router;
