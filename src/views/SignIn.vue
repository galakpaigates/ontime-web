<template>
    <section class="vh-100" style="background-color: #ececec">
        <div class="container py-5 h-100">
            <div
                class="row d-flex justify-content-center align-items-center h-100"
            >
                <div class="col-12 col-md-8 col-lg-6 col-xl-5">
                    <div
                        class="card shadow-2-strong boxShadow"
                        style="border-radius: 1rem"
                    >
                        <div id="mobileFormWrapper" class="card-body p-5">
                            <div class="d-flex justify-content-center mb-4">
                                <router-link to="/">
                                    <img
                                        src="../assets/images/ontime_logo.jpg"
                                        style="width: 9rem"
                                        alt=""
                                    />
                                </router-link>
                            </div>

                            <form
                                @submit.prevent="signIn"
                                class="needs-validation"
                                novalidate
                            >
                                <div
                                    v-if="isWarning"
                                    class="py-2 mb-3 text-center rounded"
                                    :style="`background-color: ${warningBgColor};`"
                                    id="message"
                                >
                                    <span :class="warningStatus">{{
                                        warningMessage
                                    }}</span>
                                </div>

                                <!-- EMAIL -->
                                <div
                                    data-mdb-input-init
                                    class="form-outline mb-3"
                                >
                                    <label
                                        class="form-label is-required"
                                        for="email"
                                    >
                                        Username / Email
                                        <span class="visually-hidden">
                                            (required)
                                        </span>
                                    </label>
                                    <div class="input-group has-validation">
                                        <input
                                            type="text"
                                            id="email"
                                            class="form-control form-control-lg"
                                            aria-describedby="inputGroupPrepend"
                                            v-model="email"
                                            required
                                            autofocus
                                        />

                                        <div class="invalid-feedback">
                                            Please provide an email or username.
                                        </div>
                                    </div>
                                </div>

                                <!-- PASSWORD -->
                                <div
                                    data-mdb-input-init
                                    class="form-outline mb-3"
                                >
                                    <label
                                        class="form-label is-required"
                                        for="password"
                                    >
                                        Password
                                        <span class="visually-hidden">
                                            (required)
                                        </span>
                                    </label>

                                    <div
                                        class="input-group has-validation position-relative"
                                    >
                                        <input
                                            :type="type ? 'password' : 'text'"
                                            id="password"
                                            class="form-control form-control-lg"
                                            aria-describedby="inputGroupPrepend"
                                            v-model="password"
                                            required
                                            autocomplete="true"
                                        />
                                        <div class="invalid-feedback">
                                            Please provide an email or username.
                                        </div>
                                    </div>
                                </div>

                                <!-- Checkbox -->
                                <div
                                    class="form-check d-flex justify-content-between align-items-center gap-1 mb-3"
                                >
                                    <div>
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            value=""
                                            id="form1Example3"
                                            @click="togglePassword"
                                        />
                                        <label
                                            class="form-check-label"
                                            for="form1Example3"
                                        >
                                            Show Password
                                        </label>
                                    </div>
                                    <router-link
                                        class="link fw-bold fs-7"
                                        to="/reset-password"
                                    >
                                        Forgot Password
                                    </router-link>
                                </div>

                                <div
                                    class="col-md-12 d-flex gap-3 justify-content-end"
                                >
                                    <button
                                        type="submit"
                                        class="btn btn-primary w-100"
                                        style="padding: 0.4rem"
                                        :disabled="loading"
                                    >
                                        <div
                                            class="spinner-border submitBtnLoader"
                                            role="status"
                                            v-if="loading"
                                        >
                                            <span class="visually-hidden"
                                                >Loading...</span
                                            >
                                        </div>
                                        <span v-else>
                                            <Icons v-model:icon="signInIcon" />
                                            Sign In
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import Icons from "../components/Icons.vue";
import { formValidation, getElement, removeClass } from "@/util/util";
import { API_KEY, login } from "@/assets/js";
import { setCookie } from "@/middlewares/auth.cookie";
import { jwtDecode } from "jwt-decode";

const signInIcon = "session-enter";
const hidePassword = ref(true);
const showPassword = ref(false);
const type = ref(true);
const email = ref("");
const password = ref("");
const router = useRouter();

const keepLoggedIn = ref(false);
const isWarning = ref(false);
const warningMessage = ref("");
const warningStatus = ref("");
const warningBgColor = ref("");

const loading = ref(false);

const togglePassword = () => {
    if (hidePassword.value) {
        hidePassword.value = false;
        showPassword.value = true;
        type.value = false;
    } else {
        showPassword.value = false;
        hidePassword.value = true;
        type.value = true;
    }
};

/**
 * Handles the sign-in process by validating the user's email and password,
 * making an API call to authenticate the user, and displaying appropriate messages.
 *
 * @function signIn
 * @returns {void}
 */
const signIn = async () => {
    if (loading.value) return;

    // Check if email and password fields are not empty
    if (!email.value || !password.value) {
        return;
    }

    loading.value = true;

    // Make an API call to authenticate the user
    const loginResponse = await login({
        username: email.value,
        password: password.value,
    });

    loading.value = false;

    if (!loginResponse) {
        warning("Unable to login, please try again!", "danger", "#ea060629");
        return;
    }

    const { ok, result } = loginResponse;

    // Display a warning message based on the API response
    warning(
        result.message,
        ok ? "success" : "danger",
        ok ? "#83d61631" : "#ea060629"
    );

    if (ok) {
        // After 1 second, perform further actions based on the API response
        setTimeout(() => {
            // Reset form fields and remove validation classes
            resetForm();

            // Set the user's authentication token in the cookie
            const { token } = result.data;
            const decodedToken = jwtDecode(token);
            API_KEY.value = decodedToken.a;

            setCookie("token", token, keepLoggedIn.value ? 1 : 0.5);

            // Navigate to the dashboard page
            router.push("/check-in");
        }, 1000);
    }
};

// Reset form fields and remove validation classes on form submission
const resetForm = () => {
    email.value = "";
    password.value = "";

    // Remove validation classes
    const form = getElement(".needs-validation");
    removeClass(form, "was-validated");
};

/**
 * Displays a warning message with the specified content, class name, and background color.
 * The message will be automatically hidden after 10 seconds.
 *
 * @param {string} message - The message text to display.
 * @param {string} className - The CSS class name to apply to the warning message element.
 * @param {string} bgColor - The background color to apply to the warning message container.
 */
const warning = (message, className, bgColor) => {
    isWarning.value = true;
    warningMessage.value = message;
    warningStatus.value = className;
    warningBgColor.value = bgColor;
};

onMounted(async () => {
    formValidation();
});
</script>

<style>
.form-check-label {
    font-size: 0.9rem;
}

.danger {
    color: #cd3c14 !important;
}
.success {
    color: #228722 !important;
}
</style>
