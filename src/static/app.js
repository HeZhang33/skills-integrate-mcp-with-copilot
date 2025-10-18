document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const quickSignupForm = document.getElementById("quick-signup-form");
  const currentStudentDiv = document.getElementById("current-student");
  const studentEmailInput = document.getElementById("student-email");
  const setEmailBtn = document.getElementById("set-email-btn");
  const changeEmailBtn = document.getElementById("change-email-btn");
  const studentDisplay = document.getElementById("student-display");
  const messageDiv = document.getElementById("message");

  let currentStudentEmail = "";

  // Initialize the app
  fetchActivities();

  // Email management
  setEmailBtn.addEventListener("click", () => {
    const email = studentEmailInput.value.trim();
    if (email && validateEmail(email)) {
      setCurrentStudent(email);
    } else {
      showMessage("Please enter a valid email address", "error");
    }
  });

  changeEmailBtn.addEventListener("click", () => {
    clearCurrentStudent();
  });

  function setCurrentStudent(email) {
    currentStudentEmail = email;
    studentDisplay.textContent = email;
    quickSignupForm.style.display = "none";
    currentStudentDiv.style.display = "flex";
    
    // Refresh activities to update register buttons
    fetchActivities();
    showMessage(`Email set to ${email}. You can now register for activities!`, "success");
  }

  function clearCurrentStudent() {
    currentStudentEmail = "";
    studentEmailInput.value = "";
    quickSignupForm.style.display = "block";
    currentStudentDiv.style.display = "none";
    
    // Refresh activities to update register buttons
    fetchActivities();
  }

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = createActivityCard(name, details);
        activitiesList.appendChild(activityCard);
      });

    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function createActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;
    const isStudentRegistered = currentStudentEmail && details.participants.includes(currentStudentEmail);
    const canRegister = currentStudentEmail && spotsLeft > 0 && !isStudentRegistered;
    const isFull = spotsLeft === 0;

    // Create spots info
    const spotsClass = isFull ? "spots-info full" : "spots-info";
    const spotsText = isFull ? "FULL" : `${spotsLeft} spots left`;

    // Create participants HTML with delete icons
    const participantsHTML = details.participants.length > 0
      ? `<div class="participants-section">
          <h5>Participants (${details.participants.length}/${details.max_participants}):</h5>
          <ul class="participants-list">
            ${details.participants
              .map(
                (email) =>
                  `<li>
                    <span class="participant-email">${email}</span>
                    <button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>
                  </li>`
              )
              .join("")}
          </ul>
        </div>`
      : `<p><em>No participants yet</em></p>`;

    // Create register/unregister button
    let actionButton = "";
    if (!currentStudentEmail) {
      actionButton = `<button class="register-btn" disabled>Set email first to register</button>`;
    } else if (isStudentRegistered) {
      actionButton = `<button class="register-btn" style="background-color: #f44336;" onclick="unregisterStudent('${name}', '${currentStudentEmail}')">Unregister Me</button>`;
    } else if (isFull) {
      actionButton = `<button class="register-btn" disabled>Activity Full</button>`;
    } else {
      actionButton = `<button class="register-btn" onclick="registerStudent('${name}', '${currentStudentEmail}')">Register for Activity</button>`;
    }

    activityCard.innerHTML = `
      <div class="${spotsClass}">${spotsText}</div>
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p><strong>Schedule:</strong> ${details.schedule}</p>
      <div class="participants-container">
        ${participantsHTML}
      </div>
      <div class="activity-actions">
        ${actionButton}
      </div>
    `;

    // Add event listeners to delete buttons
    activityCard.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    return activityCard;
  }

  // Global functions for button clicks
  window.registerStudent = async function(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(`Successfully registered ${email} for ${activityName}!`, "success");
        fetchActivities(); // Refresh activities list
      } else {
        showMessage(result.detail || "Registration failed", "error");
      }
    } catch (error) {
      showMessage("Failed to register. Please try again.", "error");
      console.error("Error registering:", error);
    }
  };

  window.unregisterStudent = async function(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(`Successfully unregistered ${email} from ${activityName}`, "success");
        fetchActivities(); // Refresh activities list
      } else {
        showMessage(result.detail || "Unregistration failed", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  };

  // Handle unregister functionality for delete buttons
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities(); // Refresh activities list
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }
});
