document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const message = document.getElementById("message");

    if (!loginForm) {
        console.error("Login form not found");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const role =
            document.getElementById("role").value;

        if (!username || !password || !role) {
            message.textContent = "Please fill in all fields.";
            message.style.color = "red";
            return;
        }

        message.textContent = "Logging in...";
        message.style.color = "black";

        try {

            console.log("Sending login request...");
            console.log("API URL:", API_BASE_URL + "/login");

            const response = await fetch(
                API_BASE_URL + "/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: role
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (response.ok && data.success) {

                /*
                 * Save complete user information
                 */
                sessionStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                localStorage.setItem(
                    "user_id",
                    data.user.user_id
                );

                localStorage.setItem(
                    "username",
                    data.user.username
                );

                localStorage.setItem(
                    "role",
                    data.user.role
                );

                message.textContent =
                    "Login successful! Redirecting...";

                message.style.color = "green";


                /*
                 * Backend returns lowercase roles:
                 *
                 * admin
                 * student
                 */

                if (data.user.role === "admin") {

                    window.location.replace("admin.html");

                }
                else if (data.user.role === "student") {

                    window.location.replace("student.html");

                }
                else {

                    message.textContent =
                        "Unknown user role: " +
                        data.user.role;

                    message.style.color = "red";
                }

            }
            else {

                message.textContent =
                    data.message ||
                    "Invalid username, password or role.";

                message.style.color = "red";
            }

        }
        catch (error) {

            console.error("LOGIN ERROR:", error);

            message.textContent =
                "Unable to connect to the server.";

            message.style.color = "red";
        }

    });

});
