<template>
    <div
        class="d-flex flex-column flex-shrink-0 p-3 w-100 text-white bg-dark"
        style="height: 100%"
        id="sideBar"
    >
        <div
            class="d-flex justify-content-center align-items-center"
            id="logoLinkWrapper"
        >
            <a
                href="/"
                id="logoLink"
                class="d-flex justify-content-center align-items-center mb-3 mb-md-0 text-white text-decoration-none"
            >
                <img src="../assets/images/blackBgLogo.png" class="logo" />
            </a>
            <img
                src="../assets/images/delete.png"
                class="d-none"
                id="hideSidebarBtn"
                alt="Close"
                width="30"
                height="30"
                fill="white"
                @click="hideSidebar"
                style="cursor: pointer"
            />
        </div>
        <hr />
        <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item" v-for="item in navItems" :key="item.name">
                <router-link
                    class="nav-link text-white"
                    :to="{ name: item.url || item.name }"
                    :id="item.name"
                >
                    <Icons style="margin-right: 0.5rem" :icon="item.svg" />
                    {{ item.name }}
                </router-link>
            </li>
        </ul>
        <hr />

        <div>
            <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item" @click="signOut">
                    <a href="#" class="nav-link" aria-current="page">
                        <Icons
                            style="margin-right: 0.5rem"
                            :icon="logOutIcon"
                        />
                        Log Out
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from "vue-router";
import Icons from "@/components/Icons.vue";

import { watch } from "vue";
import { removeCookie } from "@/middlewares/auth.cookie";

const route = useRoute();
const router = useRouter();
const breadCrumbs = defineModel("breadCrumbs");
const activeSection = defineModel("activeSection");
const logOutIcon = "session-leave";

activeSection.value = route.path.split("/")[1];

watch(
    () => route.path,
    (newPath) => {
        const currentSection = newPath.split("/")[1];
        activeSection.value = currentSection;
        breadCrumbs.value = [currentSection];
    }
);

const navItems = [
    {
        name: "dashboard",
        svg: "control-my-data",
    },
    {
        name: "visitors",
        svg: "group",
    },
    {
        name: "visits",
        svg: "house",
    },
    {
        name: "check in",
        url: "check-in",
        svg: "inside",
    },
    {
        name: "events",
        svg: "calendar-event-agenda",
    },
    {
        name: "employees",
        svg: "employees",
    },
    {
        name: "users",
        svg: "administrator",
    },
    {
        name: "rooms",
        svg: "bed",
    },
];

const signOut = () => {
    removeCookie("token");
    router.push("/sign-in");
};

// toggle sidebar display
function hideSidebar() {
    $("#sideBar").css("display", "none");
}
</script>

<style scoped>
#sideBar {
    overflow-y: scroll;
}

.nav-pills svg {
    width: 30px !important;
    height: 30px !important;
    margin-right: 0.5rem;
}
.nav-link {
    text-transform: capitalize !important;
}

.nav-item {
    margin: 0 !important;
}

#logoLink {
    margin-bottom: 0 !important;
}
#logoLink:hover {
    background-color: transparent !important;
    width: 65px;
    height: 65px;
}

#checkInNavItem div {
    cursor: pointer;
    border-radius: 7px;
}

#checkInNavItem div:hover {
    background-color: #eee;
    color: #000000 !important;
}

.logo {
    max-width: 70px;
    max-height: 70px;
}

@media (max-width: 800px) {
    #logoLinkWrapper {
        justify-content: space-between !important;
        padding-left: 30px;
    }
}
</style>
