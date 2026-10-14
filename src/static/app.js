document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;

        const participantsList = document.createElement("ul");
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");
          participantItem.className = "participant-item";

          const participantName = document.createElement("span");
          participantName.textContent = participant;

          const unregisterButton = document.createElement("button");
          unregisterButton.type = "button";
          unregisterButton.className = "participant-remove";
          unregisterButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          unregisterButton.title = `Unregister ${participant}`;
          unregisterButton.innerHTML = `
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
          `;
          unregisterButton.dataset.activity = name;
          unregisterButton.dataset.email = participant;

          participantItem.append(participantName, unregisterButton);
          participantsList.appendChild(participantItem);
        });

        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      return true;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
      return false;
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const unregisterButton = event.target.closest(".participant-remove");
    if (!unregisterButton) {
      return;
    }

    const { activity, email } = unregisterButton.dataset;
    unregisterButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister student");
      }

      const refreshed = await fetchActivities();
      messageDiv.textContent = refreshed
        ? result.message
        : "Student was unregistered, but the activity list could not be refreshed.";
      messageDiv.className = refreshed ? "success" : "error";
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister student. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering student:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        const refreshed = await fetchActivities();
        messageDiv.textContent = refreshed
          ? result.message
          : "Student was registered, but the activity list could not be refreshed.";
        messageDiv.className = refreshed ? "success" : "error";
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
