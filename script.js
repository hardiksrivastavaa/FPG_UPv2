// Get references to the district and college dropdowns
const districtDropdown = document.getElementById("district");
const collegeDropdown = document.getElementById("college");

// Function to populate the colleges dropdown based on the selected district
function populateCollegesDropdown() {
  const selectedDistrict = districtDropdown.value;
  collegeDropdown.innerHTML = "";

  if (selectedDistrict !== "") {
    const colleges = districtData[selectedDistrict];
    colleges.forEach((college) => {
      const option = document.createElement("option");
      option.text = college;
      option.value = college;
      collegeDropdown.appendChild(option);
    });
  }
}

districtDropdown.addEventListener("change", populateCollegesDropdown);

// Function to calculate centered x position
function getCenteredX(text, fontSize, font, pageWidth) {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  return (pageWidth - textWidth) / 2;
}

// Function to wrap text dynamically
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  words.forEach((word) => {
    const testLine = line + (line ? " " : "") + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

// Function to generate front page PDF
async function generateFrontPage() {
  const collegeElement = document.getElementById("college");
  const sessionElement = document.getElementById("session");
  const yearSemElement = document.getElementById("yearSem");
  const branch = document.getElementById("branch").value;
  const name = document.getElementById("nameInput").value;
  const subject = document.getElementById("subject").value;
  const teacher = document.getElementById("subjectTeacher").value;
  const enrollment = document.getElementById("enrollmentInput").value;
  const logoInput = document.getElementById("logoInput");

  const college = collegeElement.options[collegeElement.selectedIndex].innerText;
  const session = sessionElement.options[sessionElement.selectedIndex].innerText;
  const yearSem = yearSemElement.options[yearSemElement.selectedIndex].innerText;

  const yPositions = {
    collegeY: 739,
    logoY: 448, // Placeholder for logo position
    branchY: 265,
    subjectY: 340,
    yearSemY: 236,
    sessionY: 405,
    teacherY: 70,
    nameY: 70,
    enrollmentY: 40,
  };

  let pdfDoc;
  const url = "format.pdf";

  try {
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  } catch (error) {
    alert("Error loading the PDF file. Please check the Format.");
    return;
  }

  const pages = pdfDoc.getPages();
  const timesRomanFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRomanBold);

  // Handle logo image
  let embeddedLogo = null;
  if (logoInput.files && logoInput.files[0]) {
    const logoFile = logoInput.files[0];
    const logoBytes = await logoFile.arrayBuffer();

    try {
      // Try embedding as PNG
      embeddedLogo = await pdfDoc.embedPng(logoBytes);
    } catch {
      try {
        // Fallback to JPEG if PNG fails
        embeddedLogo = await pdfDoc.embedJpg(logoBytes);
      } catch (imageError) {
        alert("Error embedding the logo. Please use a valid PNG or JPEG file.");
        return;
      }
    }
  }

  // Load the default BTEUP logo (this is the fallback when no logo is uploaded)
  let bteupLogo = null;
  try {
    const bteupLogoBytes = await fetch('./img/bteup.jpg').then(res => res.arrayBuffer());
    bteupLogo = await pdfDoc.embedJpg(bteupLogoBytes);
  } catch (error) {
    console.error('Error loading BTEUP logo:', error);
  }


  for (const page of pages) {
    const pageWidth = page.getWidth();

    // Render college name with wrapping
    const wrappedCollegeText = wrapText(
      college,
      timesRomanFont,
      42,
      pageWidth - 40
    );
    let currentY = yPositions.collegeY;
    wrappedCollegeText.forEach((line) => {
      drawText(
        page,
        line,
        getCenteredX(line, 42, timesRomanBoldFont, pageWidth),
        currentY,
        42,
        [47, 84, 150],
        timesRomanFont
      );
      currentY -= 50; // Line spacing
    });

    // Render logo (either uploaded or BTEUP logo if no logo uploaded)
    if (embeddedLogo) {
      const logoWidth = 170;
      const logoHeight = (embeddedLogo.height / embeddedLogo.width) * logoWidth;
      const logoX = (pageWidth - logoWidth) / 2;
      page.drawImage(embeddedLogo, {
        x: logoX,
        y: yPositions.logoY,
        width: logoWidth,
        height: logoHeight,
      });
    } else if (bteupLogo) {
      const logoWidth = 170;
      const logoHeight = (bteupLogo.height / bteupLogo.width) * logoWidth;
      const logoX = (pageWidth - logoWidth) / 2;
      page.drawImage(bteupLogo, {
        x: logoX,
        y: 455,
        width: logoWidth,
        height: logoHeight,
      });
    }


    // Render other fields
    const nameX = pageWidth - timesRomanFont.widthOfTextAtSize(name, 23) - 20;
    const enrollmentX = pageWidth - timesRomanFont.widthOfTextAtSize(enrollment, 21) - 20;

    drawText(page, `${enrollment}`, enrollmentX, yPositions.enrollmentY, 21, [0, 0, 0], timesRomanFont);
    drawText(page, `${name}`, nameX, yPositions.nameY, 23, [0, 0, 0], timesRomanFont);
    drawText(page, `${teacher}`, 20, yPositions.teacherY, 23, [0, 0, 0], timesRomanFont);
    drawText(page, `${branch}`, getCenteredX(branch, 28, timesRomanFont, pageWidth), yPositions.branchY, 28, [255, 0, 0], timesRomanFont);
    drawText(page, `${yearSem}`, getCenteredX(yearSem, 24, timesRomanFont, pageWidth), yPositions.yearSemY, 24, [255, 0, 0], timesRomanFont);
    drawText(page, `Session - ${session}`, getCenteredX(`Session - ${session}`, 26, timesRomanFont, pageWidth), yPositions.sessionY, 26, [0, 0, 0], timesRomanFont);

    // Subject wrapping logic
    let subjectFontSize = 28;
    let subjectTextWidth = timesRomanBoldFont.widthOfTextAtSize(subject, subjectFontSize);
    while (subjectTextWidth > pageWidth - 40 && subjectFontSize > 10) {
      subjectFontSize -= 1;
      subjectTextWidth = timesRomanBoldFont.widthOfTextAtSize(subject, subjectFontSize);
    }
    drawText(page, `${subject}`, getCenteredX(subject, subjectFontSize, timesRomanBoldFont, pageWidth), yPositions.subjectY, subjectFontSize, [61, 104, 180], timesRomanBoldFont);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const urlBlob = URL.createObjectURL(blob);
  const downloadLink = document.getElementById("downloadLink");
  downloadLink.href = urlBlob;
  downloadLink.download = `${subject} - ${name}.pdf`;
  downloadLink.style.display = "block";
  downloadLink.innerText = "Download PDF";
}

// Draw text helper
function drawText(page, text, x, y, size, color, font) {
  page.drawText(text, {
    x: x,
    y: y,
    size: size,
    color: PDFLib.rgb(color[0] / 255, color[1] / 255, color[2] / 255),
    font: font,
  });
}

document.getElementById("generateBtn").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent form submission

  // Validate required fields
  const requiredFields = [
    "district",
    "college",
    "branch",
    "yearSem",
    "subject",
    "nameInput",
    "session",
    "subjectTeacher",
  ];
  
  let isValid = true;

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("border-red-500"); // Highlight the field with an error
      field.nextElementSibling?.remove(); // Remove existing error messages
      const errorMessage = document.createElement("p");
      errorMessage.innerText = "This field is required.";
      errorMessage.classList.add("text-red-500", "text-sm", "mt-1");
      field.parentNode.appendChild(errorMessage);
    } else {
      field.classList.remove("border-red-500");
      field.nextElementSibling?.remove(); // Remove any previous error message
    }
  });

  if (!isValid) {
console.log("fill all details");

    return; // Stop execution if validation fails
  }

  // Proceed with generating the PDF
  generateFrontPage();
});
