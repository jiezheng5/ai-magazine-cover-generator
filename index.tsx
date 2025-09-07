/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Modality} from '@google/genai';
import JSZip from 'jszip';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// DOM Elements
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const previewContainer = document.getElementById(
  'preview-container',
) as HTMLDivElement;
const magazineNameInput = document.getElementById(
  'magazine-name',
) as HTMLInputElement;
const yearInput = document.getElementById('year-input') as HTMLInputElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const resultsGrid = document.getElementById('results') as HTMLElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const resultsHeader = document.getElementById('results-header') as HTMLElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
const modalImage = document.getElementById('modal-image') as HTMLImageElement;
const modalCloseBtn = document.getElementById(
  'modal-close-btn',
) as HTMLButtonElement;

// App State
let uploadedFiles: File[] = [];
const generatedCovers = new Map<string, {data: string; mimeType: string}>();

// Set default year on load
yearInput.value = new Date().getFullYear().toString();

// --- File Upload Handling ---

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    handleFiles(target.files);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  dropZone.classList.add('active');
}

function handleDragLeave() {
  dropZone.classList.remove('active');
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  dropZone.classList.remove('active');
  if (event.dataTransfer?.files) {
    handleFiles(event.dataTransfer.files);
  }
}

function handleFiles(files: FileList) {
  const newFiles = Array.from(files).filter((file) =>
    file.type.startsWith('image/'),
  );
  uploadedFiles = [...uploadedFiles, ...newFiles];
  renderPreviews();
}

function renderPreviews() {
  previewContainer.innerHTML = '';
  if (uploadedFiles.length > 0) {
    previewContainer.style.display = 'grid';
  } else {
    previewContainer.style.display = 'none';
    return;
  }
  uploadedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'preview-image-wrapper';

      const img = document.createElement('img');
      img.src = e.target?.result as string;
      img.alt = `Preview of ${file.name}`;
      img.className = 'preview-image';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-image-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Remove ${file.name}`;
      removeBtn.onclick = () => {
        uploadedFiles.splice(index, 1);
        renderPreviews();
      };

      previewWrapper.appendChild(img);
      previewWrapper.appendChild(removeBtn);
      previewContainer.appendChild(previewWrapper);
    };
    reader.readAsDataURL(file);
  });
}

// --- Modal Logic ---

function openModal(imageSrc: string, altText: string) {
  modalImage.src = imageSrc;
  modalImage.alt = altText;
  modalOverlay.classList.add('visible');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

function closeModal() {
  modalOverlay.classList.remove('visible');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Restore scrolling
  // Reset src after transition to avoid seeing old image on next open
  setTimeout(() => {
    if (!modalOverlay.classList.contains('visible')) {
      modalImage.src = '';
      modalImage.alt = '';
    }
  }, 300); // Match CSS transition duration
}

// Event listeners for modal
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  // Close only if the overlay itself is clicked, not its children (the image)
  if (e.target === modalOverlay) {
    closeModal();
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) {
    closeModal();
  }
});

// --- Cover Generation Logic ---

generateBtn.addEventListener('click', async () => {
  const magazineName = magazineNameInput.value.trim();
  const yearValue = yearInput.value.trim();
  const year = parseInt(yearValue, 10);

  if (uploadedFiles.length === 0) {
    alert('Please upload at least one photo.');
    return;
  }
  if (!magazineName) {
    alert('Please enter a magazine name.');
    return;
  }
  if (!yearValue || isNaN(year) || year < 1900 || year > 2100) {
    alert('Please enter a valid year (e.g., 2024).');
    return;
  }

  setLoading(true);
  resultsGrid.innerHTML = '';
  generatedCovers.clear();
  resultsHeader.classList.add('hidden');
  downloadBtn.disabled = true;

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // More artistic and varied transformations for a true gallery wall mosaic
  const galleryStyles = [
    {
      transform: 'rotate(-5deg) scale(1.02) translateY(-15px) translateX(-10px)',
      zIndex: 3,
    },
    {
      transform: 'rotate(3deg) scale(0.98) translateY(10px) translateX(5px)',
      zIndex: 2,
    },
    {
      transform: 'rotate(1deg) scale(1.05) translateY(-25px) translateX(15px)',
      zIndex: 5,
    },
    {
      transform: 'rotate(6deg) scale(1.0) translateY(5px) translateX(-5px)',
      zIndex: 1,
    },
    {
      transform: 'rotate(-2deg) scale(0.97) translateY(20px) translateX(10px)',
      zIndex: 4,
    },
    {
      transform: 'rotate(-4deg) scale(1.03) translateY(0px) translateX(-20px)',
      zIndex: 2,
    },
    {
      transform: 'rotate(4.5deg) scale(1.01) translateY(-10px) translateX(20px)',
      zIndex: 3,
    },
    {
      transform: 'rotate(-1deg) scale(0.99) translateY(15px) translateX(-15px)',
      zIndex: 1,
    },
    {
      transform: 'rotate(2.5deg) scale(1.04) translateY(-5px) translateX(0px)',
      zIndex: 4,
    },
    {
      transform: 'rotate(-3.5deg) scale(0.96) translateY(25px) translateX(8px)',
      zIndex: 2,
    },
    {
      transform: 'rotate(5deg) scale(1.02) translateY(-20px) translateX(-12px)',
      zIndex: 5,
    },
    {
      transform: 'rotate(-2deg) scale(1) translateY(8px) translateX(18px)',
      zIndex: 3,
    },
  ];

  // Create placeholder cards with mosaic transformations
  months.forEach((month, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.id = `card-${month}`;
    card.innerHTML = `
      <h3>${month} ${year}</h3>
      <div class="card-content">
        <div class="card-spinner"></div>
      </div>
    `;

    // Apply predefined transformations for the mosaic effect
    // Use the index directly since we now have 12 unique styles
    const style = galleryStyles[index];
    card.style.transform = style.transform;
    card.style.zIndex = String(style.zIndex); // Control stacking order

    resultsGrid.appendChild(card);
  });

  const generationPromises = months.map((month, index) => {
    const imageFile = uploadedFiles[index % uploadedFiles.length];
    return generateCover(month, year, imageFile);
  });

  try {
    await Promise.all(generationPromises);
  } catch (error) {
    console.error('An error occurred during cover generation:', error);
    alert(
      'An error occurred. Please check the console for more details and try again.',
    );
  } finally {
    setLoading(false);
    if (generatedCovers.size > 0) {
      resultsHeader.classList.remove('hidden');
      downloadBtn.disabled = false;
    }
  }
});

async function generateCover(month: string, year: number, imageFile: File) {
  const magazineName = magazineNameInput.value.trim();
  const card = document.getElementById(`card-${month}`);
  const cardContent = card?.querySelector('.card-content') as HTMLDivElement;

  if (!card || !cardContent) return;

  try {
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    // Determine orientation based on magazine name
    const landscapeKeywords = [
      'national geographic',
      'nat geo',
      'car and driver',
      'road & track',
      'landscape',
      'motor trend',
    ];
    const isLandscape = landscapeKeywords.some((keyword) =>
      magazineName.toLowerCase().includes(keyword),
    );
    const orientationInstruction = isLandscape
      ? 'The final image must be in a landscape orientation.'
      : 'The final image must be in a portrait orientation.';

    const prompt = `Your task is to generate a magazine cover for "${magazineName}" for the ${month} ${year} issue. Follow these steps carefully:

Step 1: Analyze the provided photo to identify the subject's key facial features (e.g., face shape, eyes, nose, mouth, and any distinguishing marks). This is the 'locked facial identity' and it MUST remain consistent and recognizable. DO NOT alter this core identity.

Step 2: Create a complete magazine cover featuring this person. The cover must clearly display the text "${month} ${year}".

Step 3: While preserving the locked facial identity, creatively style the cover to reflect a theme appropriate for ${month}. You can change the following:
- Hairstyle, makeup, jewelry, and clothing.
- The person's expression and pose to match the monthly theme (e.g., joyful for summer, cozy for winter).
- The background and overall artistic style of the cover.
- Add professional-looking magazine headlines relevant to the month.

${orientationInstruction}
The final output must be a single, complete magazine cover image. Do not change the person's apparent age or gender.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        temperature: 0.15,
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(
      (part) => part.inlineData,
    );

    if (imagePart?.inlineData) {
      const {data: base64Data, mimeType} = imagePart.inlineData;
      generatedCovers.set(month, {data: base64Data, mimeType});
      const generatedImageSrc = `data:${mimeType};base64,${base64Data}`;

      // Clear the spinner and prepare for new content
      cardContent.innerHTML = '';
      cardContent.style.padding = '0';
      cardContent.style.position = 'relative';

      // Add clickable class and listener for modal
      cardContent.classList.add('clickable');
      cardContent.addEventListener('click', () => {
        openModal(
          generatedImageSrc,
          `${magazineName} - ${month} ${year} cover`,
        );
      });

      // Create the image element
      const img = document.createElement('img');
      img.src = generatedImageSrc;
      img.alt = `${magazineName} - ${month} ${year} cover`;
      img.className = 'generated-image';

      // Create the individual download button
      const downloadSingleBtn = document.createElement('button');
      downloadSingleBtn.className = 'download-single-btn';
      downloadSingleBtn.title = `Download ${month} cover`;
      downloadSingleBtn.setAttribute('aria-label', `Download ${month} cover`);
      downloadSingleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>`;

      downloadSingleBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent card click from opening modal
        const link = document.createElement('a');
        link.href = generatedImageSrc;
        const extension = mimeType.split('/')[1] || 'png';
        const cleanMagazineName =
          magazineName.trim().replace(/\s+/g, '_') || 'Magazine';
        link.download = `${cleanMagazineName}_${month}_${year}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      cardContent.appendChild(img);
      cardContent.appendChild(downloadSingleBtn);
    } else {
      throw new Error('No image was generated by the model.');
    }
  } catch (error) {
    console.error(`Failed to generate cover for ${month}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    cardContent.innerHTML = `<div class="card-error">
        <strong>Generation Failed</strong>
        <p>Could not create cover for ${month}. Please try again.</p>
        <small>${errorMessage}</small>
      </div>`;
  }
}

// --- Download Logic ---

downloadBtn.addEventListener('click', async () => {
  const magazineName =
    magazineNameInput.value.trim().replace(/\s+/g, '_') || 'Magazine';

  if (generatedCovers.size === 0) {
    alert('No covers to download!');
    return;
  }

  downloadBtn.disabled = true;
  const originalBtnContent = downloadBtn.innerHTML;
  downloadBtn.innerHTML = `
    <div class="card-spinner" style="width: 20px; height: 20px;"></div>
    <span>Zipping...</span>
  `;

  try {
    const zip = new JSZip();
    for (const [month, cover] of generatedCovers.entries()) {
      const extension = cover.mimeType.split('/')[1] || 'png';
      zip.file(`${magazineName}_${month}.${extension}`, cover.data, {
        base64: true,
      });
    }

    const blob = await zip.generateAsync({type: 'blob'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${magazineName}_Covers.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Failed to create zip file:', error);
    alert('Could not create the zip file. Please try again.');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalBtnContent;
  }
});

// --- Utility Functions ---

function setLoading(isLoading: boolean) {
  generateBtn.disabled = isLoading;
  if (isLoading) {
    loader.style.display = 'flex';
    loader.setAttribute('aria-hidden', 'false');
  } else {
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the data:mime/type;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

export {};
