// File input handling
document.getElementById('photo').addEventListener('change', function(e) {
  const fileLabel = document.getElementById('fileLabel');
  const file = e.target.files[0];
  
  if (file) {
    fileLabel.textContent = `📷 ${file.name}`;
    fileLabel.classList.add('has-file');
  } else {
    fileLabel.textContent = '📁 Click to upload photo (JPG, PNG)';
    fileLabel.classList.remove('has-file');
  }
});

/**
 * Generates the ID card by validating form inputs and populating card data
 */
function generateCard() {
  // Validate form inputs
  const requiredFields = ['name', 'grade', 'dob', 'contactNumber', 'address'];
  const emptyFields = requiredFields.filter(field => !document.getElementById(field).value.trim());
  
  if (emptyFields.length > 0) {
    alert('Please fill in all required fields!');
    return;
  }

  // Show the card and download button
  document.getElementById('idCard').style.display = 'flex';
  document.getElementById('downloadBtn').style.display = 'block';
  document.getElementById('successMessage').style.display = 'block';

  // Populate card data
  document.getElementById('cName').innerText = document.getElementById('name').value;
  document.getElementById('cGrade').innerText = document.getElementById('grade').value;
  document.getElementById('cDob').innerText = formatDate(document.getElementById('dob').value);
  document.getElementById('cContact').innerText = document.getElementById('contactNumber').value;
  document.getElementById('cAddress').innerText = document.getElementById('address').value;

  // Handle photo upload
  const photo = document.getElementById('photo').files[0];
  if (photo) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('cardPhoto').innerHTML = `
        <img src="${e.target.result}" alt="Student Photo">
      `;
    };
    reader.readAsDataURL(photo);
  } else {
    document.getElementById('cardPhoto').innerHTML = `
      <div class="photo-placeholder">👤</div>
    `;
  }

  // Scroll to card after generation
  setTimeout(() => {
    document.getElementById('idCard').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, 500);
}

/**
 * Formats a date string to DD/MM/YYYY format
 * @param {string} dateString - The input date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Downloads the generated ID card as a PDF
 */
async function downloadCard() {
  const downloadBtn = document.getElementById('downloadBtn');
  const originalText = downloadBtn.innerHTML;
  
  try {
    downloadBtn.innerHTML = '⏳ Generating PDF...';
    downloadBtn.disabled = true;
    
    const card = document.getElementById("idCard");
    
    // Wait for all images inside the card to load
    const images = card.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        // Add timeout to prevent hanging
        setTimeout(resolve, 3000);
      });
    }));

    // Capture the card as a high-res canvas
    const canvas = await html2canvas(card, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      scale: 2, // High resolution
      logging: false,
      onclone: function(clonedDoc) {
        // Ensure the cloned document styles are applied
        const clonedCard = clonedDoc.getElementById('idCard');
        if (clonedCard) {
          clonedCard.style.display = 'flex';
        }
      }
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    
    // Calculate dimensions to fit the card properly
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // Standard ID card size in mm (approximately)
    const pdfWidth = 80.5; // 3.375 inches
    const pdfHeight = 120.6; // 2.125 inches
    
    let finalWidth, finalHeight;
    if (ratio > pdfWidth / pdfHeight) {
      finalWidth = pdfWidth;
      finalHeight = pdfWidth / ratio;
    } else {
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * ratio;
    }

    const pdf = new jsPDF({
      orientation: finalWidth > finalHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [finalWidth, finalHeight]
    });

    pdf.addImage(
      imgData,
      'PNG',
      0,
      0,
      finalWidth,
      finalHeight,
      undefined,
      'FAST'
    );

    const studentName = document.getElementById('name').value.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`${studentName}_ID_Card.pdf`);

    // Success feedback
    downloadBtn.innerHTML = '✅ PDF Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }, 3000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;
  }
}