// Helper function to update dropdown options
// function updateDropdown(dropdown, options) {
//   dropdown.innerHTML = '<option value="">Select</option>';
//   options.forEach((item) => {
//     const option = document.createElement("option");
//     option.text = item;
//     dropdown.add(option);
//   });
// }

function updateDropdown(dropdown, items) {
  dropdown.innerHTML = '<option value="">Select</option>';

  // Add 'Others' option last with visual cue 
  const othersOption = document.createElement("option");
  othersOption.classList.add("text-red-800", "font-semibold");
  othersOption.value = "others";
  othersOption.textContent = "Others (Type Manually)";
  dropdown.appendChild(othersOption);

  // Add regular options
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    dropdown.appendChild(option);
  });
}

function handleCustomInputToggle(dropdown, input) {
  dropdown.addEventListener("change", () => {
    if (dropdown.value === "others") {
      input.classList.remove("hidden");
      input.setAttribute("required", "required");
    } else {
      input.classList.add("hidden");
      input.removeAttribute("required");
    }
  });
}
// Helper Function to calculate centered x position based on text length and page width
function getCenteredX(text, fontSize, font, pageWidth) {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  return (pageWidth - textWidth) / 2;
}

// Helper Function to Draw text on PDF page
const drawText = async (page, text, x, y, size, color, font) => {
  page.drawText(text, {
    x: x,
    y: y,
    size: size,
    color: PDFLib.rgb(color[0] / 255, color[1] / 255, color[2] / 255),
    font: font,
  });
};

// Helper Function to adjust font size based on text length and page width
function adjustFontSize(text, font, pageWidth) {
  let size = 28;
  let width = font.widthOfTextAtSize(text, size);

  while (width > pageWidth - 40 && size > 10) {
    size--;
    width = font.widthOfTextAtSize(text, size);
  }

  return size;
}

// Helper Function to split text into lines based on max width
function splitTextIntoLines(text, fontSize, font, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

// Helper Function to get wrapped lines with font size adjustment
function getWrappedLines(text, font, maxWidth, maxLines, maxFontSize, minFontSize = 24) {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    const lines = splitTextIntoLines(text, fontSize, font, maxWidth);
    if (lines.length <= maxLines) {
      return { lines, fontSize };
    }
    fontSize -= 1; // Decrease font size step-by-step
  }

  // If even minFontSize doesn't fit, return with truncated lines
  const finalLines = splitTextIntoLines(text, minFontSize, font, maxWidth).slice(0, maxLines);
  return { lines: finalLines, fontSize: minFontSize };
}
