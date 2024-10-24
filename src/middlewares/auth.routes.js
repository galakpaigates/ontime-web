import router from "@/router";
import store from "@/store";
import { isAuthenticated } from "./auth.cookie";

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!isAuthenticated()) {
            return next({ name: "sign-in" });
        } else return next();
    }
    // if user is logged in and they're trying to access a route that requires
    // them to be logged, redirect them to the Landing Page
    else if (
        to.matched.some((record) => record.meta.logOutRequired) &&
        isAuthenticated()
    ) {
        // if (to.path === "/reset-password/code") {
        // 	if (!store.state.hasVisitedResetPassword) {
        // 		return next("/reset-password");
        // 	}
        // 	return next();
        // }

        // if (to.path === "/reset-password/new-password") {
        // 	if (!store.state.hasVisitedResetPassword) {
        // 		return next("/reset-password/code");
        // 	}
        // 	return next();
        // }

        return next("/");
    } else next();
});

export default router;
