document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
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
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
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

  // Leaderboard functionality
  const leaderboardActivitySelect = document.getElementById("leaderboard-activity");
  const leaderboardContent = document.getElementById("leaderboard-content");

  // Function to fetch and display leaderboard for an activity
  async function fetchLeaderboard(activityName) {
    if (!activityName) {
      leaderboardContent.innerHTML = "<p>Select an activity to view leaderboard</p>";
      return;
    }

    try {
      const response = await fetch(`/leaderboard/${encodeURIComponent(activityName)}`);
      
      if (!response.ok) {
        leaderboardContent.innerHTML = "<p>No leaderboard data available for this activity</p>";
        return;
      }

      const data = await response.json();
      const rankings = data.rankings;

      if (rankings.length === 0) {
        leaderboardContent.innerHTML = "<p>No rankings yet for this activity</p>";
        return;
      }

      // Create leaderboard table
      let tableHTML = `
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student Email</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
      `;

      rankings.forEach((entry) => {
        let rankClass = "";
        if (entry.rank === 1) rankClass = "gold";
        else if (entry.rank === 2) rankClass = "silver";
        else if (entry.rank === 3) rankClass = "bronze";

        tableHTML += `
          <tr>
            <td><span class="rank-badge ${rankClass}">${entry.rank}</span></td>
            <td>${entry.email}</td>
            <td>${entry.score}</td>
          </tr>
        `;
      });

      tableHTML += `
          </tbody>
        </table>
      `;

      leaderboardContent.innerHTML = tableHTML;
    } catch (error) {
      leaderboardContent.innerHTML = "<p>Failed to load leaderboard. Please try again later.</p>";
      console.error("Error fetching leaderboard:", error);
    }
  }

  // Handle leaderboard activity selection
  leaderboardActivitySelect.addEventListener("change", (event) => {
    fetchLeaderboard(event.target.value);
  });

  // Navigation functionality
  const navActivityBtn = document.getElementById("nav-activities");
  const navLeaderboardBtn = document.getElementById("nav-leaderboard");
  const activitiesSection = document.getElementById("activities-section");
  const leaderboardSection = document.getElementById("leaderboard-section");

  navActivityBtn.addEventListener("click", () => {
    activitiesSection.classList.add("active");
    leaderboardSection.classList.remove("active");
    navActivityBtn.classList.add("active");
    navLeaderboardBtn.classList.remove("active");
  });

  navLeaderboardBtn.addEventListener("click", () => {
    activitiesSection.classList.remove("active");
    leaderboardSection.classList.add("active");
    navActivityBtn.classList.remove("active");
    navLeaderboardBtn.classList.add("active");
  });

  // Function to populate activity dropdowns
  async function populateActivityDropdowns() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const activityNames = Object.keys(activities);

      // Populate leaderboard activity dropdown
      activityNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        leaderboardActivitySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error populating dropdowns:", error);
    }
  }

  // Initialize app
  fetchActivities();
  populateActivityDropdowns();
});
