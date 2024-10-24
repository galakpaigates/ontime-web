<template>
    <AlertModal :data="alert" />

    <!-- EVENT PARTICIPANTS TABLE -->
    <div id="visit-view" class="d-flex flex-column container">
        <div
            class="d-flex justify-content-between align-items-center container p-0 mx-auto"
            style="margin-top: 1.5rem"
        >
            <BreadCrumbs :breadCrumbs="activeBreadCrumbs" />
        </div>

        <div
            id="eventCheckInWrapper"
            class="mt-3 p-0 d-flex flex-column"
            style="border: none; background-color: transparent"
        >
            <div id="selectEventWrapper">
                <h2 v-if="chosenEventTitle">{{ chosenEventTitle }}</h2>
                <div
                    class="w-100 d-flex justify-content-between gap-2 pb-1"
                    id="dropdownAddEventBtnsWrapper"
                >
                    <button
                        id="dropdownBtn"
                        class="btn btn-dropdown dropdown-toggle text-start"
                        type="button"
                        @click="
                            $('#ongoingEventsGridWrapper').toggleClass('d-none')
                        "
                    >
                        Ongoing Events
                    </button>
                    <router-link to="/events/add-event">
                        <button class="btn btn-primary" id="createEventBtn">
                            Create Event
                        </button>
                    </router-link>
                </div>

                <!-- Loader -->
                <div v-if="loading" class="w-100 text-center ms-2 pt-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <!-- No Ongoing Events -->
                <div
                    v-if="noEvents"
                    class="text text-primary w-100 ms-2 fw-bold fs-3"
                >
                    No Ongoing Events!
                </div>
                <div
                    v-if="errorRetrievingEvents"
                    class="w-100 ms-2 fw-bold fs-3"
                >
                    <span class="text-danger">
                        Unable to load Ongoing Events, try again!
                    </span>
                </div>

                <div
                    v-if="events && events.length"
                    id="ongoingEventsGridWrapper"
                >
                    <div
                        id="ongoingEventsGrid"
                        class="d-flex px-2 justify-content-start flex-wrap align-items-start gap-4 py-3"
                    >
                        <div
                            v-for="(event, idx) in events"
                            :class="{ 'chosen-event': chosenEvent === idx }"
                            class="d-flex flex-column align-items-center justify-content-center p-3 checkInOption"
                            @click="updateEventTerm(event, idx)"
                        >
                            <Icons
                                :height="'58%'"
                                :width="'60%'"
                                class="optionIcon"
                                icon="calendar-event-agenda"
                            />
                            <h3>{{ event.title }}</h3>
                            <div
                                class="d-flex flex-column gap-2 w-100 text-start text text-secondary"
                            >
                                <!-- Start & End Date -->
                                <div class="d-flex flex-column gap-1">
                                    <span> <Icons icon="clock" /> Date </span>
                                    <span class="fw-bold">
                                        {{
                                            formatDateTime(event.startDate, {
                                                date: true,
                                            })
                                        }}
                                        to<br />
                                        {{
                                            formatDateTime(event.endDate, {
                                                date: true,
                                            })
                                        }}
                                    </span>
                                </div>
                                <!-- Facilitator -->
                                <div class="d-flex flex-column gap-1">
                                    <span>
                                        <Icons icon="administrator" />
                                        Facilitator
                                    </span>
                                    <span class="fw-bold">
                                        {{ event.facilitator }}
                                    </span>
                                </div>
                                <!-- Type -->
                                <div class="d-flex flex-column gap-1">
                                    <span> <Icons icon="apps" /> Type </span>
                                    <span class="fw-bold">{{
                                        event.type
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- All Participants -->
            <div v-if="showTable" class="container">
                <DataTable
                    :key="dataTableKey"
                    id="eventParticipantsTable"
                    class="display w-100 table"
                    :columns="columns"
                    :options="dataTableOptions"
                    ref="table"
                />

                <h3 class="mt-5 text-center fw-bold" v-if="showError">
                    Unable to load event participants, try again!
                </h3>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from "vue";
import BreadCrumbs from "../BreadCrumbs.vue";
import AlertModal from "../modals/AlertModal.vue";
import Icons from "../Icons.vue";
import {
    registerVisit,
    getSingleVisitor,
    registerVisitor,
    getEvents,
    API_URL,
    API_KEY,
} from "@/assets/js/index.js";
import $ from "jquery";

import {
    formValidation,
    getElement,
    showModal,
    formatMsisdn,
    formatDateTime,
} from "@/util/util";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net";
import "datatables.net-responsive";
import "datatables.net-responsive-dt";

DataTable.use(DataTablesCore);

const table = ref();
const showTable = ref(false);
const showError = ref(false);
const dataTableKey = ref(0);

// Events Data
const events = ref([]);
const eventID = ref("");
const eventValue = ref("");
const eventTem = ref("");
const chosenEventTitle = ref("");

const selectedParticipant = ref({});
const selectedRow = ref("");

// columns for Data Table
const columns = [
    { data: "created_at", visible: false },
    { data: "first_name", title: "First name" },
    { data: "last_name", title: "Last name" },
    { data: "msisdn", title: "Phone number" },
    { data: "email", title: "Email" },
    { data: "session", title: "Session" },
    {
        data: null,
        title: "Visited Today",
        className: "text-center",
        render: (data) => {
            return data.participant_id
                ? `<div class="w-100 text-center text-success fw-bold">
					  <span>Yes</span>
				   </div>`
                : `<div class="w-100 text-center text-danger fw-bold">
					  <span>No</span>
				  </div>`;
        },
    },
    {
        data: null,
        title: "Action",
        className: "text-center",
        render: (data) => {
            return `<button type="button" class="btn btn-secondary checkInBtn"
                            style="--bs-btn-padding-y: .25rem; --bs-btn-padding-x: .5rem; width: 5rem; --bs-btn-font-size: 0.70rem;" ${
                                alreadyCheckedIn(data) ? "disabled" : ""
                            }>
                            ${
                                alreadyCheckedIn(data)
                                    ? "Checked In"
                                    : "Check In"
                            }
                      </button>`;
        },
    },
];

const alreadyCheckedIn = (data) =>
    !data.visit_departure_time && data.participant_id;

// Options for Data Table
const dataTableOptions = ref({
    responsive: true,
    select: true,
    serverSide: true,
    ajax: {
        url: `${API_URL}/events/${eventID.value}/participants`,
        type: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("authorization", API_KEY);
        },
        data: (query) => {
            return {
                start: query.start,
                limit: query.length,
                search: query.search.value,
                sort: query.columns[query.order[0].column].data,
                order: query.order[0].dir,
            };
        },
        dataSrc: (json) => {
            showError.value = false;

            json.recordsTotal = json.data.totalLength;
            json.recordsFiltered = json.data.totalLength;

            participants.value = json.data.participants;

            participants.value.forEach((visitor) => {
                visitor.address = formatAddress(visitor.address);
            });

            return participants.value;
        },
        error: (error) => {
            console.log("Error fetching data:", error);
            showError.value = true;
        },
    },
    lengthMenu: [10, 25, 50, 100],
    language: {
        searchPlaceholder: "Search ...",
        search: "",
        emptyTable: `
			<div class="d-flex flex-column justify-content-center align-items-center gap-3 p-4" >
				<svg style="width: 5rem; height: 5rem;" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" fill-rule="evenodd" d="M33.8 87.5V69.684A10.02 10.02 0 0126.3 60V48.75a18.7 18.7 0 011.763-7.943 16.64 16.64 0 01-10.72-4.533A15.29 15.29 0 008.8 50v11.912C8.8 65.81 12.001 69 15.9 69v18.5a4.965 4.965 0 004.959 5h14.857a7.47 7.47 0 01-1.916-5m48.958-51.226a16.64 16.64 0 01-10.72 4.533A18.7 18.7 0 0173.8 48.75V60a10.02 10.02 0 01-7.5 9.684V87.5a7.47 7.47 0 01-1.916 5h14.857a4.965 4.965 0 004.959-5V69c3.899 0 7.1-3.19 7.1-7.088V50a15.29 15.29 0 00-8.542-13.726M71.3 12.5a12.44 12.44 0 00-6.538 1.845q.135.286.26.579a16.24 16.24 0 01-2.416 16.644l.723.356a18.8 18.8 0 016.668 5.509A12.5 12.5 0 1071.3 12.5m-7.5 8.75A13.75 13.75 0 1150.05 7.5 13.75 13.75 0 0163.8 21.25m-1.576 12.916a17.747 17.747 0 01-24.348 0A16.25 16.25 0 0028.8 48.75V60a7.5 7.5 0 007.5 7.5v20a5 5 0 005 5h17.5a5 5 0 005-5v-20a7.5 7.5 0 007.5-7.5V48.75a16.25 16.25 0 00-9.076-14.584m-32.12 3.266a18.8 18.8 0 016.667-5.508l.723-.357a16.27 16.27 0 01-2.416-16.643q.125-.292.26-.58A12.5 12.5 0 1028.8 37.5a13 13 0 001.304-.067Z"/></svg>
				No Event Participant
			</div>
		`,
        zeroRecords: `
			<div class="d-flex flex-column justify-content-center align-items-center gap-3 p-4" >
				<svg style="width: 5rem; height: 5rem;" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" fill-rule="evenodd" d="M33.8 87.5V69.684A10.02 10.02 0 0126.3 60V48.75a18.7 18.7 0 011.763-7.943 16.64 16.64 0 01-10.72-4.533A15.29 15.29 0 008.8 50v11.912C8.8 65.81 12.001 69 15.9 69v18.5a4.965 4.965 0 004.959 5h14.857a7.47 7.47 0 01-1.916-5m48.958-51.226a16.64 16.64 0 01-10.72 4.533A18.7 18.7 0 0173.8 48.75V60a10.02 10.02 0 01-7.5 9.684V87.5a7.47 7.47 0 01-1.916 5h14.857a4.965 4.965 0 004.959-5V69c3.899 0 7.1-3.19 7.1-7.088V50a15.29 15.29 0 00-8.542-13.726M71.3 12.5a12.44 12.44 0 00-6.538 1.845q.135.286.26.579a16.24 16.24 0 01-2.416 16.644l.723.356a18.8 18.8 0 016.668 5.509A12.5 12.5 0 1071.3 12.5m-7.5 8.75A13.75 13.75 0 1150.05 7.5 13.75 13.75 0 0163.8 21.25m-1.576 12.916a17.747 17.747 0 01-24.348 0A16.25 16.25 0 0028.8 48.75V60a7.5 7.5 0 007.5 7.5v20a5 5 0 005 5h17.5a5 5 0 005-5v-20a7.5 7.5 0 007.5-7.5V48.75a16.25 16.25 0 00-9.076-14.584m-32.12 3.266a18.8 18.8 0 016.667-5.508l.723-.357a16.27 16.27 0 01-2.416-16.643q.125-.292.26-.58A12.5 12.5 0 1028.8 37.5a13 13 0 001.304-.067Z"/></svg>
				No match!
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
    createdRow: (row, data) => {
        $(row).on("click", () => {
            selectedParticipant.value = data;
            selectedRow.value = row;
        });
    },
    destroy: true,
    order: [[0, "desc"]],
});

// event retrieval flags
const loading = ref(true);
const noMatch = ref(false);
const noEvents = ref(false);
const errorRetrievingEvents = ref(false);

// visit creation data
const participant_id = ref("");
const msisdn = ref("");
const visitorId = ref("");
const host_id = ref("");
const room_id = ref("");
const address = ref("");
const purpose = ref("");
const room = ref("");

const chosenEvent = ref("");

// Modal Data
const alert = ref({
    status: "",
    title: "",
    message: "",
    pageLink: "",
});

// others
const visitor = ref("");
const participants = ref([]);
const participant = ref("");
const MAX_DETAIL_LEN = 30;

const activeBreadCrumbs = ref([]);

const props = defineProps({
    breadCrumbs: {
        type: Array,
        required: true,
    },
    getRoom: Boolean,
});

activeBreadCrumbs.value = ["check-in", "event"];

// section loader flag
const $sectionIsLoading =
    getCurrentInstance().appContext.config.globalProperties.$sectionIsLoading;

// Lifecycle Hooks
onMounted(async () => {
    await getEventsOptions();
    formValidation();

    // delegate event on check in button
    $(document).on("click", ".checkInBtn", () => {
        setTimeout(
            () =>
                checkInBtnClicked(selectedRow.value, selectedParticipant.value),
            150
        );
    });

    $("#breadCrumbs").css("display", "block");
    const breadCrumbsOl = $("#breadCrumbsOl")[0];

    if (window.innerWidth <= 1070) {
        breadCrumbsOl.innerHTML = `
			<li>
				<span class="text fw-bold">
					Check In for Event
				</span>
			</li>
		`;
    }
});

function checkInBtnClicked(row, data) {
    if (data && data.participant_id && !data.visit_departure_time) {
        // inform user visitor is still checked in
        showModal("#alertModal", "#alertModalBody");

        alert.value.status = "warning";
        alert.value.message = `Visitor ${data.first_name} ${data.last_name} is still checked in`;
        alert.value.pageLink = `/visits`;
    }
    // otherwise check visitor in
    else {
        participantDetail(data.id);

        participant.value = row;
    }
}

const updateEventTerm = (event, idx) => {
    chosenEvent.value = idx;
    chosenEventTitle.value = event.title;

    purpose.value = event.title;
    eventValue.value = event.title;
    eventID.value = event.id;

    // destroy table
    $("eventParticipantsTable").DataTable().destroy();

    // update api url in options object
    dataTableOptions.value.ajax.url = `${API_URL}/events/${eventID.value}/participants`;

    // reload the table with the new url
    dataTableKey.value += 1;

    const selectedEvent = events.value.find((val) => val.id === eventID.value);

    if (selectedEvent) {
        room.value = selectedEvent.room;
    }

    // display data table if it's not already displayed
    if (showTable.value == false) showTable.value = true;
    $("#ongoingEventsGridWrapper").addClass("d-none");
};

// function for inserting each username in the select element
const getEventsOptions = async () => {
    try {
        events.value = await getEvents(null, { current: true });

        // if `getEvents` returns a falsy value, indicate error
        if (!events.value) {
            console.log("error caught");
            eventTem.value = undefined;
            loading.value = false;
            noMatch.value = false;
            errorRetrievingEvents.value = true;

            return;
        }

        // format event for drop down
        events.value = events.value.events.map((event) => ({
            id: event.id,
            title: event.title,
            startDate: event.start_date,
            endDate: event.end_date,
            type: event.type,
            facilitator: event.facilitator,
            room_id: event.room_id,
            host_id: event.host_id,
        }));

        if (!events.value.length) noEvents.value = true;

        eventTem.value = events.value;
        loading.value = false;
        noMatch.value = false;
        errorRetrievingEvents.value = false;
    } catch (error) {
        console.error("Error retrieving users:", error);

        loading.value = false;
        errorRetrievingEvents.value = true;
        noMatch.value = false;
        noEvents.value = false;
    }
};

// function to validate form before it submit the form
const checkParticipantIn = async () => {
    if (!msisdn.value || !visitor.value || !purpose.value || !room_id.value) {
        return;
    }

    getElement("body").removeAttribute("style");

    // Required values for checking a visitor in
    const visitData = {
        visitor_id: visitorId.value,
        event_id: eventID.value,
        items: [],
        room_id: room_id.value,
        host_id: host_id.value,
        purpose: purpose.value,
        address: address.value,
        participant_id: participant_id.value,
    };

    const response = await registerVisit(visitData);
    $sectionIsLoading.value = false;

    if (response.ok) {
        // Update visitor status for last visit
        updateVisitorVisitStatus();

        // Reload data table to update the departure time of the participant that was just checked in
        dataTableKey.value += 1;

        alert.value.message = "Visitor Checked In";
        alert.value.status = "success";
        alert.value.pageLink = response.ok ? `/visits` : "";

        // Reset form if the response is successful
        resetForm();
    } else {
        alert.value.status = "danger";
        alert.value.message = response.result.message;
    }

    // show alert modal
    showModal();
};

const resetForm = () => {
    visitor.value = "";
    msisdn.value = "";
    eventValue.value = "";
};

const participantDetail = async (id) => {
    const event = events.value.find((val) => val.id === eventID.value);

    // Find the specific participant being checked in
    const participant = participants.value.find((val) => val.id === id);

    let visitorData;

    $sectionIsLoading.value = true;
	
    if (participant) {
        // Assign participant id for visit checking in
        participant_id.value = participant.id;

        // Check if the visitor exists
        visitorData = await getSingleVisitor({
            msisdn: participant.visitor_id || formatMsisdn(participant.msisdn),
        });
    }

    // Create visitor if this participant is not already a visitor.
    if (!visitorData) {
        const response = await registerVisitor({
            first_name: participant.first_name,
            last_name: participant.last_name,
            email: participant.email,
            msisdn: participant.msisdn,
            address: address.value,
            gender: participant.gender,
        });

        if (response.ok) {
            visitorData = response.result.data[0];
        } else {
            alert.value.message = response.result.message;
            alert.value.status = "danger";

            showModal();
            return;
        }
    }

    // further ensure which exact participant the visitor we're checking is
    else if (
        participant.visitor_id &&
        participant.visitor_id != visitorData.id
    ) {
        alert.value.message =
            "Duplicated Phone Number - A Visitor already exists with this phone number!";
        alert.value.status = "danger";

        showModal();
        return;
    }

    // Add first name, add middle name if the visitor has one, and add last name
    visitor.value = `${visitorData.first_name} ${visitorData.last_name}`;

    visitorId.value = visitorData.id;
    msisdn.value = visitorData.msisdn;
    room_id.value = event.room_id;
    host_id.value = event.host_id;

    checkParticipantIn();
};

function formatAddress(address) {
    if (!address) {
        return "";
    }
    const addressLen = address.length;
    const newAddress =
        addressLen >= MAX_DETAIL_LEN
            ? `${address.slice(0, MAX_DETAIL_LEN)}...`
            : address;

    return newAddress;
}

const updateVisitorVisitStatus = () => {
    const tr = participant.value;
    if (!tr) return;

    const visitedToday = $(tr).children("td")[6];
    $(visitedToday).html(`<span class="text-success fw-bold">Yes</span>`);

    // Reset for new participant.
    participant.value = "";
};
</script>

<style scoped>
@media (max-width: 1250px) {
    #dropdownAddEventBtnsWrapper {
        padding-bottom: 1.5rem !important;
    }
}

.belonging {
    text-transform: capitalize;
    display: inline-block;
    margin: 20px 10px 0 0;
    padding: 6px 12px;
    background-color: #eee;
    border-radius: 20px;
    font-size: 12px;
    letter-spacing: 1px;
    font-weight: bold;
    color: #777;
    cursor: pointer;
}
a {
    text-decoration: none;
}
.form-select {
    padding: calc(1rem - 1px) 1rem calc(0.5rem + 1px);
}

.modal {
    background-color: #1616157a;
}

#createEventBtn {
    min-width: 140px;
}

#dropdownBtn {
    justify-content: space-between !important;
    width: 100%;
    max-height: 50px;
}

#dropdownAddEventBtnsWrapper {
    min-width: 100%;
}

@media (max-width: 400px) {
    #dropdownAddEventBtnsWrapper {
        flex-direction: column;
    }

    #dropdownAddEventBtnsWrapper > a > button {
        width: 100%;
    }
}

.optionIcon {
    min-height: 80px;
    min-width: 78px;
}

.chosen-event {
    outline: 2px solid #595959;
    box-shadow: 0 0px 20px rgba(0, 0, 0, 0.3) !important;
}

.checkInOption {
    display: flex;
    align-items: center;
    border-radius: 15px;
    background-color: #eee;
    min-width: 225px;
    height: auto !important;
    width: 20%;
    text-align: center;
    text-decoration: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}
.checkInOption:hover {
    padding: 15px !important;
}

/* Small Screen */
@media (max-width: 1250px) {
    #ongoingEventsGrid {
        justify-content: center !important;
    }

    #eventCheckInWrapper {
        gap: 0.75rem !important;
    }

    #selectEventWrapper {
        margin-top: 0 !important;
        max-width: 95%;
        min-width: 95%;
        margin-left: auto;
        margin-right: auto;
    }
}
</style>
