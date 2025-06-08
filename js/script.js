const districtDropdown = document.getElementById("district");
const collegeDropdown = document.getElementById("college");
const branchDropdown = document.getElementById("branch");
const sessionDropdown = document.getElementById("session");
const yearSemDropdown = document.getElementById("yearSem");
const form = document.getElementById("frontPageForm");

// Function to populate teacher dropdown based on selected branch
const populateSubjects = () => {
  if (!(districtDropdown.value in districtData)) {
    updateDropdown(collegeDropdown, []);
    return;
  }
  const colleges = districtData[districtDropdown.value];
  console.log(colleges);
  updateDropdown(collegeDropdown, colleges);
}

// Function to handle dropdown change based on selected branch and yearSem
const handleDropdownChange = () => {
  populateSubjects();
};

const showErrorModal = (error) => {
  const modal = document.getElementById("errorModal");
  const heading = document.getElementById("errorHeading");
  const message = document.getElementById("errorMessage");

  if (error?.message?.includes("image")) {
    heading.textContent = "Invalid Image Format";
    message.textContent = error.message;
    // message.textContent = "Only PNG and JPG image formats are supported. Please upload a valid logo image.";
  }

  modal.classList.remove("hidden");
};

const closeErrorModal = () => {
  document.getElementById("errorModal").classList.add("hidden");
}


// Event listener to submit form and generate front page PDF
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let formData = {
    "district": districtDropdown.value,
    "college": collegeDropdown.value,
    "branch": branchDropdown.value,
    "yearSem": yearSemDropdown.value,
    "subject": document.getElementById("subjectInput").value.trim(),
    "name": document.getElementById("nameInput").value.trim()
  };

  try {
    await generateFrontPage();
  } catch (error) {
    console.error("Front Page Generation Failed:", error);
    showErrorModal(error);
    return;
  }

  fetch(
    "https://script.google.com/macros/s/AKfycbyf0sXmHP4F89HzQB7FF4EI9H3FjXq-9SMRlsjyQ9VMdgzO2AJnoKyAeduNjlP3AL3v/exec",
    {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }
  ).catch((error) => console.error("Error:", error));

});

// Function to generate front page PDF
const generateFrontPage = async () => {

  const college = collegeDropdown.options[collegeDropdown.selectedIndex].innerText;
  const branch = branchDropdown.options[branchDropdown.selectedIndex].innerText;
  const session = sessionDropdown.options[sessionDropdown.selectedIndex].innerText;
  const yearSem = yearSemDropdown.options[yearSemDropdown.selectedIndex].innerText;
  const teacher = document.getElementById("teacherInput").value.trim();
  const subject = document.getElementById("subjectInput").value.trim();
  const studentName = document.getElementById("nameInput").value.trim();
  const studentEnrollment = document.getElementById("enrollmentInput").value.trim();


  const yPositions = {
    collegeY: 739,
    branchY: 265,
    subjectY: 340,
    yearSemY: 236,
    sessionY: 405,
    teacherY: 70,
    nameY: 70,
    enrollmentY: 40,
  };

  const url = "./assets/format.pdf";
  const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const page = pdfDoc.getPage(0);
  const timesRomanFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRomanBold);

  const pageWidth = page.getWidth();

  const maxCollegeTextWidth = pageWidth - 100; // e.g., 50px padding both sides
  const maxFontSize = 38;
  const maxLines = 2;

  const { lines, fontSize } = getWrappedLines(college, timesRomanBoldFont, maxCollegeTextWidth, maxLines, maxFontSize);

  let currentY = yPositions.collegeY;

  lines.forEach((line) => {
    const textWidth = timesRomanBoldFont.widthOfTextAtSize(line, fontSize);
    const x = (pageWidth - textWidth) / 2;
    drawText(page, line, x, currentY, fontSize, [20, 85, 150], timesRomanBoldFont);
    currentY -= fontSize + 10;
  });

  const logoInput = document.getElementById("collegeLogo");
  const file = logoInput.files[0];
  let logoBytes;
  let logoImage;

  if (file) {
    logoBytes = await file.arrayBuffer();

    try {
      // Try both types — if unsupported, it’ll fail and go to catch
      if (file.type === "image/png") {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } else {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
    } catch (err) {
      const isUnsupported =
        !["image/png", "image/jpeg", "image/jpg"].includes(file.type);

      const message = isUnsupported
        ? "Unsupported file type. Only PNG and JPG image is allowed."
        : "Corrupted or invalid image file. Please upload a valid PNG or JPG image.";

      throw new Error(message);
    }

  } else {
    // fallback logo
    const response = await fetch("./assets/bteup.png");
    const defaultLogoBytes = await response.arrayBuffer();
    logoImage = await pdfDoc.embedPng(defaultLogoBytes);
  }


  logoImage.scale(0.42);

  const fixedWidth = 187;
  const aspectRatio = logoImage.height / logoImage.width;
  const fixedHeight = fixedWidth * aspectRatio;

  const logoX = (pageWidth - fixedWidth) / 2;

  page.drawImage(logoImage, {
    x: logoX,
    y: yPositions.collegeY - 278,
    width: fixedWidth,
    height: fixedHeight,
  });

  // Adjust name and enrollment positions based on page width
  const nameX = pageWidth - timesRomanFont.widthOfTextAtSize(studentName, 23) - 20;
  const enrollmentX = pageWidth - timesRomanFont.widthOfTextAtSize(studentEnrollment, 21) - 20;

  // Adjust font sizes
  let branchFontSize = adjustFontSize(branch, timesRomanFont, pageWidth);
  let subjectFontSize = adjustFontSize(subject, timesRomanBoldFont, pageWidth);

  // Branch, Year & Sem, Session, Subject (centered)
  await drawText(page, `Session - ${session}`, getCenteredX(`Session - ${session}`, 26, timesRomanFont, pageWidth), yPositions.sessionY, 26, [0, 0, 0], timesRomanFont);
  await drawText(page, subject, getCenteredX(subject, subjectFontSize, timesRomanBoldFont, pageWidth), yPositions.subjectY, subjectFontSize, [61, 104, 180], timesRomanBoldFont);
  await drawText(page, branch, getCenteredX(branch, branchFontSize, timesRomanFont, pageWidth), yPositions.branchY, branchFontSize, [255, 0, 0], timesRomanFont);
  await drawText(page, yearSem, getCenteredX(yearSem, 24, timesRomanFont, pageWidth), yPositions.yearSemY, 24, [255, 0, 0], timesRomanFont);

  // Teacher (left aligned)
  await drawText(page, teacher, 20, yPositions.teacherY, 23, [0, 0, 0], timesRomanFont);

  // Student Name & Enrollment (right aligned)
  await drawText(page, studentEnrollment, enrollmentX, yPositions.enrollmentY, 21, [0, 0, 0], timesRomanFont);
  await drawText(page, studentName, nameX, yPositions.nameY, 23, [0, 0, 0], timesRomanFont);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const urlBlob = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = urlBlob;
  link.download = `${subject} - ${studentName}.pdf`;
  link.click();
  window.open(urlBlob);
}