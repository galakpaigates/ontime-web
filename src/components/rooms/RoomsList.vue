<template>
    <div
        class="table-responsive container p-0 d-flex flex-column"
        style="gap: 0.7rem"
    >
        <div
            style="font-weight: 400; font-size: 1rem"
            class="mb-0 d-flex align-items-center"
            v-if="filterDates.from || filterDates.to"
        >
            {{ filterInfo }}

            <button
                type="button"
                class="btn btn-primary mx-2"
                style="
                    --bs-btn-padding-y: 0.25rem;
                    --bs-btn-padding-x: 0.5rem;
                    --bs-btn-font-size: 0.75rem;
                "
                @click="clearFilter"
            >
                Clear
            </button>
        </div>

        <div>
            <DataTable
                id="roomsTable"
                :key="tableKey"
                class="display w-100 table"
                :columns="columns"
                :options="options"
                ref="table"
                v-show="!showError"
            />
            <h3 class="mt-5 text-center fw-bold" v-if="showError">
                Unable to load rooms, try again!
            </h3>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net";
import "datatables.net-responsive";
import "datatables.net-responsive-dt";
import { useRouter } from "vue-router";

import { API_KEY, API_URL } from "@/assets/js/index.js";
import { formatDateTime } from "@/util/util.js";

DataTable.use(DataTablesCore);

const filterDates = defineModel("filterDates");
const totalRooms = defineModel("totalRooms");

const columns = [
    { data: "name", title: "Name" },
    { data: "type", title: "Type" },
    { data: "code", title: "Code" },
    { data: "created_at", title: "Creation Date" },
];

const options = {
    responsive: true,
    select: true,
    serverSide: true,
    ajax: {
        url: `${API_URL}rooms`,
        type: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("authorization", API_KEY.value);
        },
        data: (query) => {
            return {
                start: query.start,
                limit: query.length,
                search: query.search.value,
                from: filterDates.value.from || "",
                to: filterDates.value.to || "",
                sort: query.columns[query.order[0].column].data,
                order: query.order[0].dir,
            };
        },
        dataSrc: (json) => {
            showError.value = false;
            refresh.value = false;

            const { rooms, totalLength } = json.data;

            json.recordsTotal = totalLength;
            json.recordsFiltered = totalLength;
            totalRooms.value = totalLength;

            rooms.forEach((room) => {
		room.type = room.type.charAt(0).toUpperCase() + room.type.slice(1);
                room.created_at = formatDateTime(room.created_at, {
                    date: true,
                });
            });

            return rooms;
        },
        error: (error) => {
            console.log("Error fetching data:", error);
            showError.value = true;
            refresh.value = false;
        },
    },
    responsive: true,
    lengthMenu: [10, 25, 50, 100],
    language: {
        searchPlaceholder: "Search ...",
        search: "",
        emptyTable: `
			<div class="d-flex gap-3 my-3 flex-column align-items-center">
				No Rooms to show!
				<svg xmlns="http://www.w3.org/2000/svg" style="width: 80px; height: 80px" fill="currentColor" class="solaris-icon si-group" viewBox="0 0 1000 1000">
					<path d="M338 875V696.837A100.18 100.18 0 0 1 263 600V487.5a187.2 187.2 0 0 1 17.626-79.433 166.44 166.44 0 0 1-107.2-45.325A152.94 152.94 0 0 0 88 500v119.118C88 658.1 120.015 690 159 690v185a49.65 49.65 0 0 0 49.588 50h148.57A74.7 74.7 0 0 1 338 875m489.576-512.258a166.44 166.44 0 0 1-107.2 45.325A187.2 187.2 0 0 1 738 487.5V600a100.18 100.18 0 0 1-75 96.837V875a74.7 74.7 0 0 1-19.158 50h148.57A49.65 49.65 0 0 0 842 875V690c38.985 0 71-31.9 71-70.882V500a152.94 152.94 0 0 0-85.424-137.258M713 125a124.4 124.4 0 0 0-65.376 18.446c.9 1.913 1.769 3.84 2.6 5.794a162.38 162.38 0 0 1-24.162 166.435l7.231 3.564a187.9 187.9 0 0 1 66.676 55.086A125 125 0 1 0 713 125m-75 87.5A137.5 137.5 0 1 1 500.5 75 137.5 137.5 0 0 1 638 212.5m-15.763 129.164a177.47 177.47 0 0 1-243.474 0A162.5 162.5 0 0 0 288 487.5V600a75 75 0 0 0 75 75v200a50 50 0 0 0 50 50h175a50 50 0 0 0 50-50V675a75 75 0 0 0 75-75V487.5a162.5 162.5 0 0 0-90.763-145.836m-321.2 32.661a187.9 187.9 0 0 1 66.676-55.086l7.231-3.564A162.7 162.7 0 0 1 350.78 149.24c.827-1.954 1.7-3.881 2.6-5.794A125 125 0 1 0 288 375a126 126 0 0 0 13.035-.675Z" style="fill-rule:evenodd"/>
				</svg>
				<button
					class="btn btn-secondary empty-table"
					onclick="document.getElementById('addRoomBtn').click()"
				>
                    <svg style="width: 1rem; height: 2rem;" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" d="M85 40H60V15a5 5 0 00-5-5H45a5 5 0 00-5 5v25H15a5 5 0 00-5 5v10a5 5 0 005 5h25v25a5 5 0 005 5h10a5 5 0 005-5V60h25a5 5 0 005-5V45a5 5 0 00-5-5"/></svg>
					New
				</button>
			</div>
        `,
        zeroRecords: `
			<div class="d-flex gap-3 my-3 flex-column align-items-center">
				No match found!
				<svg xmlns="http://www.w3.org/2000/svg" style="width: 80px; height: 80px" fill="currentColor" class="solaris-icon si-group" viewBox="0 0 1000 1000">
					<path d="M338 875V696.837A100.18 100.18 0 0 1 263 600V487.5a187.2 187.2 0 0 1 17.626-79.433 166.44 166.44 0 0 1-107.2-45.325A152.94 152.94 0 0 0 88 500v119.118C88 658.1 120.015 690 159 690v185a49.65 49.65 0 0 0 49.588 50h148.57A74.7 74.7 0 0 1 338 875m489.576-512.258a166.44 166.44 0 0 1-107.2 45.325A187.2 187.2 0 0 1 738 487.5V600a100.18 100.18 0 0 1-75 96.837V875a74.7 74.7 0 0 1-19.158 50h148.57A49.65 49.65 0 0 0 842 875V690c38.985 0 71-31.9 71-70.882V500a152.94 152.94 0 0 0-85.424-137.258M713 125a124.4 124.4 0 0 0-65.376 18.446c.9 1.913 1.769 3.84 2.6 5.794a162.38 162.38 0 0 1-24.162 166.435l7.231 3.564a187.9 187.9 0 0 1 66.676 55.086A125 125 0 1 0 713 125m-75 87.5A137.5 137.5 0 1 1 500.5 75 137.5 137.5 0 0 1 638 212.5m-15.763 129.164a177.47 177.47 0 0 1-243.474 0A162.5 162.5 0 0 0 288 487.5V600a75 75 0 0 0 75 75v200a50 50 0 0 0 50 50h175a50 50 0 0 0 50-50V675a75 75 0 0 0 75-75V487.5a162.5 162.5 0 0 0-90.763-145.836m-321.2 32.661a187.9 187.9 0 0 1 66.676-55.086l7.231-3.564A162.7 162.7 0 0 1 350.78 149.24c.827-1.954 1.7-3.881 2.6-5.794A125 125 0 1 0 288 375a126 126 0 0 0 13.035-.675Z" style="fill-rule:evenodd"/>
				</svg>
                <button
					class="btn btn-secondary empty-table"
					onclick="document.getElementById('addRoomBtn').click()"
                    style="margin-left: -.5rem"
				>
                    <svg style="width: 1rem; height: 2rem;" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" d="M85 40H60V15a5 5 0 00-5-5H45a5 5 0 00-5 5v25H15a5 5 0 00-5 5v10a5 5 0 005 5h25v25a5 5 0 005 5h10a5 5 0 005-5V60h25a5 5 0 005-5V45a5 5 0 00-5-5"/></svg>
					New
				</button>
			</div>
		`,
        loadingRecords: `
			<div class="d-flex justify-content-center p-4">
				<div class="spinner-border" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		`,
    },
    order: [[0, "desc"]],
    destroy: true,
    createdRow: (row, data) => {
        $(row).on("click", () => {
            router.push("/rooms/" + data.id);
        });
    },
};

const table = ref();
const tableKey = ref(0);
const showError = ref(false);
const MAX_DETAIL_LEN = 30;

const router = useRouter();
const refresh = defineModel("refresh");

watch(
    () => refresh.value,
    () => {
        // update table Key to force data table to re render
        tableKey.value += 1;
    }
);

const filterInfo = computed(() => {
    return `Showing rooms ${
        filterDates.value.from
            ? "from " + formatDateTime(filterDates.value.from, { date: true })
            : ""
    } ${
        filterDates.value.to
            ? "up to " + formatDateTime(filterDates.value.to, { date: true })
            : ""
    } `;
});

// retrieve events in date range
watch(
    // watch for change on the from or to dates
    () => [filterDates.value.from, filterDates.value.to],
    ([newFrom, newTo]) => {
        // update the date from and to dates for the request query
        filterDates.value.from = newFrom;
        filterDates.value.to = newTo;

        // update the table key and force the table to reload
        tableKey.value += 1;
    }
);

const clearFilter = () => {
    filterDates.value.from = "";
    filterDates.value.to = "";
    tableKey.value++;
};
</script>

<style scoped>
table {
    margin: 0;
}

table input {
    background-color: red !important;
}

tr {
    cursor: pointer;
}

th,
td {
    padding: 0.9rem;
    font-size: 0.9rem;
}

@media (min-width: 768px) and (max-width: 1440px) {
    th,
    td {
        padding: 0.7rem;
    }
}

svg.solaris-icon {
    width: 1.2rem;
    height: 1.2rem;
}

svg {
    width: 1rem !important;
    height: 2rem !important;
}

.empty-table:hover svg path {
    fill: black !important;
}
</style>
