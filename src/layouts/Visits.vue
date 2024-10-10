<template>
    <div id="visit-view" class="d-flex flex-column container">
        <div
            id="breadCrumbsOptionsTopWrapper"
            class="d-flex justify-content-between align-items-center container p-0 mx-auto"
        >
            <BreadCrumbs :breadCrumbs="breadCrumbs" />

            <div class="d-flex" style="gap: 0.521rem; margin-left: auto">
                <RefreshList @click="refresh = true" />

                <div class="dropdown">
                    <Options />
                    <ul class="dropdown-menu boxShadow rounded">
                        <li
                            @click="displayExportModay"
                            id="export"
                            class="dropdown-item"
                        >
                            Export
                        </li>
                        <li
                            @click="displayFilterModal"
                            id="filter-visits"
                            class="dropdown-item"
                        >
                            Filter Visits
                        </li>
                    </ul>
                </div>

                <router-link :to="{ name: 'check-in' }">
                    <button
                        type="button"
                        id="addVisitBtn"
                        class="btn btn-primary"
                    >
                        <Icons v-model:icon="add" />
                        New
                    </button>
                </router-link>
            </div>
        </div>

        <VisitList
            v-model:refresh="refresh"
            v-model:filterDates="filterDates"
            v-model:totalVisits="totalVisits"
        />

        <FilterModal @done="filterCompleted" />
        <ExportModal
            :exportFields="exportFields"
            v-model:exportTitle="exportTitle"
            @export="exportVisits"
        />
        <RouterView />
    </div>
</template>

<script setup>
import { getCurrentInstance, ref, onMounted } from "vue";

import BreadCrumbs from "../components/BreadCrumbs.vue";
import VisitList from "../components/visits/VisitList.vue";
import RefreshList from "../components/RefreshList.vue";
import Options from "../components/Options.vue";
import Icons from "../components/Icons.vue";
const add = "add";

import { RouterLink, RouterView } from "vue-router";
import { csvExport, getVisits } from "../assets/js/index.js";
import FilterModal from "@/components/modals/FilterModal.vue";
import ExportModal from "@/components/modals/ExportModal.vue";
import {
    formatVisitData,
    hideSidebarOnSmallScreen,
    showModal,
} from "@/util/util";

const breadCrumbs = defineModel("breadCrumbs");
const refresh = defineModel("refresh");
const totalVisits = defineModel("totalVisits");
const exportTitle = defineModel("exportTitle");

breadCrumbs.value = [ "Today's Visits" ];

const exportFields = ref([
    { name: "Date time", selected: false },
    { name: "Visitor", selected: false },
    { name: "Purpose", selected: false },
    { name: "Items", selected: false },
    { name: "Gender", selected: false },
    { name: "Room name", selected: false },
    { name: "Host name", selected: false },
    { name: "Phone number", selected: false },
    { name: "Departure time", selected: false },
    { name: "Occupation", selected: false },
]);

exportTitle.value = "Visits";

const exportVisits = async (fields) => {
    const { visits } = await getVisits({
        limit: totalVisits.value,
    });

    const formattedVisitData = formatVisitData(visits);

    const selectedVisits = formattedVisitData.map((visit) => {
        const data = {};
        for (const field of fields) {
            if (field === "phone_number") {
                data[field] = `0${visit.msisdn.slice(3)}`;
            } else if (field === "items") {
                // if items array is empty, pass an empty string
                if (Array.isArray(visit[field]))
                    data[field] = visit[field].join(", ");
                else data[field] = visit[field];
            } else {
                data[field] = visit[field];
            }
        }

        return data;
    });

    csvExport(selectedVisits);
};

const filterDates = ref({
    from: "",
    to: "",
});

function displayFilterModal() {
    showModal("#filterModal", "#modal-dialog");
}

// section loader flag
const $sectionIsLoading =
    getCurrentInstance().appContext.config.globalProperties.$sectionIsLoading;

const displayExportModay = () => {
    showModal("#exportModal", "#modal-dialog");
};

// update date ranges, then it will be caught by watchers in visits table
function filterCompleted(newDates) {
    filterDates.value = newDates;
}

onMounted(() => {
    hideSidebarOnSmallScreen();

    // ensure loader is not visible
    $sectionIsLoading.value = false;
});
</script>

<style scoped>
#visit-view {
    gap: 1.5rem;
}

svg {
    height: 20px !important;
    margin: 0 !important;
}

.btn {
    padding: 0.5rem !important;
}
.btn:hover {
    border: 0.125rem solid black !important;
}

.btn:hover g {
    fill: white;
}
.list-options svg {
    height: 20px !important;
    margin: 0 !important;
}
.m-3 {
    display: flex;
    height: 300px;
    align-items: center;
    flex-direction: column;
    /* background-color: aquamarine; */
    padding: 0.5rem;
    justify-content: space-between;
}

.m-3 button {
    width: 250px;
    padding: 0.5rem;
}

#offcanvasExample {
    position: fixed;
    z-index: 999999;
}

li {
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
}
</style>
