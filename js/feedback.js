// Modal Elements
const modal = document.getElementById("feedbackModal");
const introSection = document.getElementById("introSection");
const feedbackFormSection = document.getElementById("feedbackFormSection")
const modalContent = document.getElementById("feedbackCard");
const closeBtn = document.getElementById("closeModal");
const thankYouMessage = document.getElementById("thankYouMessage");
const closeThankYouBtn = document.getElementById("closeThankYou");
const feedbackForm = document.forms["feedbackForm"];
const hasSeenModal = sessionStorage.getItem("feedbackModalSeen");

const showFeedbackForm = () => {
    introSection.classList.add("hidden");
    closeBtn.classList.remove("hidden");
    feedbackFormSection.classList.remove("hidden");
}

// Function to apply a random message
const applyRandomThankYouMessage = () => {
    const randomMessage = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)];
    document.getElementById("heading").textContent = randomMessage.heading;
    document.getElementById("body").textContent = randomMessage.body;
    document.getElementById("subText").textContent = randomMessage.subText;
};

// Show modal when page loads
window.addEventListener("DOMContentLoaded", () => {
    if (!hasSeenModal) {
        modal.classList.remove("hidden");
        closeBtn.classList.add("hidden");
        gsap.fromTo(
            modalContent,
            { opacity: 0, scale: 0.85, y: -30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }
        );
        sessionStorage.setItem("feedbackModalSeen", "true");
    }
});

// Modal close animation
const hideModalAnimation = {
    opacity: 0,
    scale: 0.85,
    y: -30,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
        modal.classList.add("hidden");
    },
};

// Manual close button
closeBtn.addEventListener("click", () => {
    gsap.to(modalContent, hideModalAnimation);
});

// Close thank-you view and reset form
closeThankYouBtn.addEventListener("click", () => {
    gsap.to(thankYouMessage, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            modal.classList.add("hidden");
            feedbackForm.reset();
            feedbackForm.classList.remove("hidden");
            thankYouMessage.classList.add("hidden");
        },
    });
});

// Form submit with silent Google Script POST
const scriptURL =
    "https://script.google.com/macros/s/AKfycbxMiwH5191Ra6H-0HVglcobT7BxPGeHofuZsicBt1umbXAfCORFhsXKVoiD_QmIcT1W/exec";

feedbackForm.addEventListener("submit", (e) => {
    e.preventDefault();

    applyRandomThankYouMessage();

    // Hide form, show thank-you message
    feedbackForm.classList.add("hidden");
    closeBtn.classList.add("hidden");
    thankYouMessage.classList.remove("hidden");

    // Animate thank you message in
    gsap.fromTo(
        thankYouMessage,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
    );

    // Submit silently
    fetch(scriptURL, {
        method: "POST",
        body: new FormData(feedbackForm),
    }).catch((error) => {
        console.error("Submission Error!", error.message);
    });
});
