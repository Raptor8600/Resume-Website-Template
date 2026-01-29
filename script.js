// Script.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            if (window.innerWidth <= 768) {
                if (isVisible) {
                    navLinks.style.display = 'none';
                } else {
                    navLinks.style.display = 'flex';
                    navLinks.style.flexDirection = 'column';
                    navLinks.style.position = 'absolute';
                    navLinks.style.top = '100%';
                    navLinks.style.left = '0';
                    navLinks.style.width = '100%';
                    navLinks.style.backgroundColor = 'white';
                    navLinks.style.padding = '1rem';
                    navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    navLinks.style.zIndex = '1001';
                }
            }
        });
    }

    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('fade-in-section');
        observer.observe(section);
    });

    // --- PROJECT CAROUSEL DOTS ---
    const carousel = document.querySelector('.projects-carousel');
    const dotsContainer = document.getElementById('carousel-dots');
    const projectCards = carousel ? carousel.querySelectorAll('.experience-card') : [];

    if (carousel && dotsContainer && projectCards.length > 0) {
        // Clear existing dots
        dotsContainer.innerHTML = '';

        // Create dots
        projectCards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                const cardWidth = projectCards[0].offsetWidth + parseInt(getComputedStyle(carousel).gap);
                carousel.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
            });
            dotsContainer.appendChild(dot);
        });

        // Update active dot on scroll
        carousel.addEventListener('scroll', () => {
            const scrollLeft = carousel.scrollLeft;
            const cardWidth = projectCards[0].offsetWidth + parseInt(getComputedStyle(carousel).gap);
            const activeIndex = Math.round(scrollLeft / cardWidth);

            dotsContainer.querySelectorAll('.dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === activeIndex);
            });
        });
    }

    // --- ADMIN / EDIT MODE LOGIC ---
    const adminTrigger = document.getElementById('admin-trigger');
    const adminBar = document.getElementById('admin-bar');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Hidden File Input for Image Upload
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    document.body.appendChild(imageInput);

    // Hidden File Input for PDF Upload
    const pdfInput = document.createElement('input');
    pdfInput.type = 'file';
    pdfInput.accept = 'application/pdf';
    pdfInput.style.display = 'none';
    document.body.appendChild(pdfInput);

    let currentEditingImage = null;
    let currentEditingPdfLink = null;

    if (adminTrigger) {
        adminTrigger.addEventListener('click', async (e) => {
            e.preventDefault();
            const password = prompt("Enter Admin Password:");
            if (password === 'Password-M-Z-A') {
                enableEditMode();
            } else {
                alert("Incorrect password.");
            }
        });
    }

    function enableEditMode() {
        document.body.classList.add('edit-mode');
        adminBar.classList.remove('hidden');

        // Text Editing
        const editables = document.querySelectorAll('[data-editable="true"]');
        editables.forEach(el => {
            el.setAttribute('contenteditable', 'true');
        });

        // Image Editing Setup
        const editableImages = document.querySelectorAll('[data-editable-image="true"]');
        editableImages.forEach(img => {
            img.style.cursor = 'pointer';
            img.style.outline = '4px solid var(--color-secondary)';
            img.title = "Click to upload new image";
            img.addEventListener('click', handleImageClick);
        });

        // Link Editing Setup (Email, LinkedIn)
        const editableLinks = document.querySelectorAll('[data-editable-link="true"]');
        editableLinks.forEach(link => {
            link.style.cursor = 'pointer';
            link.style.outline = '2px dashed #00ff00'; // Green dashed for links
            link.title = "Click to edit URL";

            // Prevent default click and use custom handler
            link.addEventListener('click', handleLinkClick);
        });

        // PDF Editing Setup
        const editablePdfs = document.querySelectorAll('[data-editable-pdf="true"]');
        editablePdfs.forEach(link => {
            link.style.cursor = 'pointer';
            link.style.outline = '2px dashed red'; // Red dashed for PDF
            link.title = "Click to upload PDF resume";
            link.addEventListener('click', handlePdfClick);
        });

        // Show Add Card Buttons
        const addExpBtn = document.getElementById('add-experience-btn');
        const addProjBtn = document.getElementById('add-project-btn');
        const addAwardBtn = document.getElementById('add-award-btn');

        if (addExpBtn) {
            addExpBtn.classList.remove('hidden');
            addExpBtn.style.display = 'inline-block';
        }
        if (addProjBtn) {
            addProjBtn.classList.remove('hidden');
            addProjBtn.style.display = 'inline-block';
        }
        if (addAwardBtn) {
            addAwardBtn.classList.remove('hidden');
            addAwardBtn.style.display = 'inline-block';
        }

        // Add Delete Buttons to Existing Cards
        addDeleteButtons();

        alert("Edit Mode Active.\n\n- TEXT: Click text to type.\n- IMAGES: Click profile photo to upload.\n- LINKS: Click buttons/links to change URL.\n- PDF: Click 'Resume' button to upload PDF.\n- ADD CARDS: Use '+ Add Experience' or '+ Add Project' buttons.\n- DELETE: Click 'X' button on cards to remove them.\n- SAVE: Don't forget to click 'Save Changes'!");
    }

    // --- ADD DELETE BUTTONS ---
    function addDeleteButtons() {
        // Add to experience cards
        document.querySelectorAll('.experience-grid .experience-card').forEach(card => {
            if (!card.querySelector('.delete-card-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-card-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete this card';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Delete this experience card?')) {
                        card.remove();
                    }
                });
                card.style.position = 'relative';
                card.appendChild(deleteBtn);
            }
        });

        // Add to project cards
        document.querySelectorAll('.projects-carousel .experience-card').forEach(card => {
            if (!card.querySelector('.delete-card-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-card-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete this card';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Delete this project card?')) {
                        card.remove();
                        // Update dots
                        const carousel = document.querySelector('.projects-carousel');
                        const dotsContainer = document.getElementById('carousel-dots');
                        const projectCards = carousel.querySelectorAll('.experience-card');
                        dotsContainer.innerHTML = '';
                        projectCards.forEach((_, index) => {
                            const dot = document.createElement('div');
                            dot.classList.add('dot');
                            if (index === 0) dot.classList.add('active');
                            dot.addEventListener('click', () => {
                                const cardWidth = projectCards[0].offsetWidth + parseInt(getComputedStyle(carousel).gap);
                                carousel.scrollTo({
                                    left: index * cardWidth,
                                    behavior: 'smooth'
                                });
                            });
                            dotsContainer.appendChild(dot);
                        });
                    }
                });
                card.style.position = 'relative';
                card.appendChild(deleteBtn);
            }
        });
    }

    // --- Handlers ---

    function handleImageClick(e) {
        if (!document.body.classList.contains('edit-mode')) return;
        currentEditingImage = e.target;
        imageInput.click();
    }

    function handleLinkClick(e) {
        if (!document.body.classList.contains('edit-mode')) return;
        e.preventDefault();
        const link = e.currentTarget; // use currentTarget in case of inner icons
        const currentHref = link.getAttribute('href');
        const newHref = prompt("Enter new URL (e.g., https://linkedin.com/in/yourname or mailto:you@example.com):", currentHref);

        if (newHref !== null) {
            link.setAttribute('href', newHref);
        }
    }

    function handlePdfClick(e) {
        if (!document.body.classList.contains('edit-mode')) return;
        e.preventDefault();
        currentEditingPdfLink = e.currentTarget;
        pdfInput.click();
    }

    // --- File Inputs Change ---

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && currentEditingImage) {
            const reader = new FileReader();
            reader.onload = function (event) {
                currentEditingImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && currentEditingPdfLink) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Warning: This PDF is large (" + (file.size / 1024 / 1024).toFixed(2) + "MB). It might make your website slow to load since it's embedded.");
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                // Set the href to the Base64 data
                currentEditingPdfLink.setAttribute('href', event.target.result);
                currentEditingPdfLink.setAttribute('download', 'resume.pdf');
                alert("PDF uploaded successfully! It is now embedded in the button.");
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Disable & Save ---

    function disableEditMode() {
        document.body.classList.remove('edit-mode');
        adminBar.classList.add('hidden');

        // Disable Text
        const editables = document.querySelectorAll('[data-editable="true"]');
        editables.forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });

        // Disable Images
        const editableImages = document.querySelectorAll('[data-editable-image="true"]');
        editableImages.forEach(img => {
            img.style.cursor = '';
            img.style.outline = '';
            img.removeEventListener('click', handleImageClick);
        });

        // Disable Links
        const editableLinks = document.querySelectorAll('[data-editable-link="true"]');
        editableLinks.forEach(link => {
            link.style.cursor = '';
            link.style.outline = '';
            link.removeEventListener('click', handleLinkClick);
        });

        // Disable PDFs
        const editablePdfs = document.querySelectorAll('[data-editable-pdf="true"]');
        editablePdfs.forEach(link => {
            link.style.cursor = '';
            link.style.outline = '';
            link.removeEventListener('click', handlePdfClick);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm("Discard changes and exit edit mode?")) {
                location.reload();
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const clone = document.documentElement.cloneNode(true);

            const cloneAdminBar = clone.querySelector('#admin-bar');
            if (cloneAdminBar) cloneAdminBar.classList.add('hidden');

            const cloneEditables = clone.querySelectorAll('[contenteditable="true"]');
            cloneEditables.forEach(el => {
                el.removeAttribute('contenteditable');
            });

            // Clean up styles
            const cloneImages = clone.querySelectorAll('[data-editable-image="true"]');
            cloneImages.forEach(img => { img.style.outline = ''; img.style.cursor = ''; });

            const cloneLinks = clone.querySelectorAll('[data-editable-link="true"]');
            cloneLinks.forEach(link => { link.style.outline = ''; link.style.cursor = ''; });

            const clonePdfs = clone.querySelectorAll('[data-editable-pdf="true"]');
            clonePdfs.forEach(link => { link.style.outline = ''; link.style.cursor = ''; });

            // Remove inputs
            const inputs = clone.querySelectorAll('input[type="file"]');
            inputs.forEach(input => input.remove());

            const newContent = "<!DOCTYPE html>\n" + clone.outerHTML;

            try {
                const opts = {
                    types: [{
                        description: 'HTML File',
                        accept: { 'text/html': ['.html'] },
                    }],
                    suggestedName: 'index.html',
                };

                const handle = await window.showSaveFilePicker(opts);
                const writable = await handle.createWritable();
                await writable.write(newContent);
                await writable.close();

                alert("Changes saved successfully!");
                disableEditMode();

            } catch (err) {
                console.error(err);
                if (err.name !== 'AbortError') {
                    alert("Failed to save changes. See console for details.");
                }
            }
        });
    }

    // --- ADD CARD FUNCTIONALITY ---

    // Add Experience Card
    const addExpBtn = document.getElementById('add-experience-btn');
    if (addExpBtn) {
        addExpBtn.addEventListener('click', () => {
            const experienceGrid = document.querySelector('.experience-grid');
            const newCard = document.createElement('div');
            newCard.className = 'experience-card';
            newCard.innerHTML = `
                <div class="exp-header">
                    <div>
                        <h3 data-editable="true">[Job Title]</h3>
                        <p class="company" data-editable="true">[Company / Organization Name]</p>
                    </div>
                    <div class="exp-meta" data-editable="true">
                        <p>[Location]</p>
                        <p>[Start Date] – [End Date]</p>
                    </div>
                </div>
                <div class="exp-body" data-editable="true">
                    <ul>
                        <li>[Key achievement or responsibility.]</li>
                        <li>[Another success metric or project lead.]</li>
                        <li>[Collaborated with X team to achieve Y result.]</li>
                    </ul>
                </div>
                <div class="tech-stack" data-editable="true">
                    <span>Skill A</span>
                    <span>Skill B</span>
                </div>
            `;
            experienceGrid.appendChild(newCard);

            // Make new card editable
            newCard.querySelectorAll('[data-editable="true"]').forEach(el => {
                el.setAttribute('contenteditable', 'true');
            });

            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-card-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this card';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this experience card?')) {
                    newCard.remove();
                }
            });
            newCard.style.position = 'relative';
            newCard.appendChild(deleteBtn);

            // Scroll to new card
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // Add Project Card
    const addProjBtn = document.getElementById('add-project-btn');
    if (addProjBtn) {
        addProjBtn.addEventListener('click', () => {
            const carousel = document.querySelector('.projects-carousel');
            const newCard = document.createElement('div');
            newCard.className = 'experience-card project-card';
            newCard.innerHTML = `
                <h3 data-editable="true">[Project Title]</h3>
                <p class="company" data-editable="true">[Project Subtitle / Context]</p>
                <div class="spacer" style="height: 1rem;"></div>
                <div class="project-image-container" style="margin-bottom: 1rem; height: 150px; background: #eee; border-radius: 4px; overflow:hidden;">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23999' text-anchor='middle' dy='.3em'%3EProject Image%3C/text%3E%3C/svg%3E"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="New Project"
                         data-editable-image="true">
                </div>
                <div class="exp-body" data-editable="true">
                    <p>[Brief description of the project.]</p>
                </div>
                <div class="tech-stack" data-editable="true">
                    <span>Skill A</span>
                    <span>Skill B</span>
                </div>
            `;
            carousel.appendChild(newCard);

            // Make new card editable
            newCard.querySelectorAll('[data-editable="true"]').forEach(el => {
                el.setAttribute('contenteditable', 'true');
            });

            // Make new image editable
            const newImg = newCard.querySelector('[data-editable-image="true"]');
            if (newImg) {
                newImg.style.cursor = 'pointer';
                newImg.style.outline = '4px solid var(--color-secondary)';
                newImg.title = "Click to upload new image";
                newImg.addEventListener('click', handleImageClick);
            }

            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-card-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this card';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this project card?')) {
                    newCard.remove();
                    // Update dots
                    const dotsContainer = document.getElementById('carousel-dots');
                    const projectCards = carousel.querySelectorAll('.experience-card');
                    dotsContainer.innerHTML = '';
                    projectCards.forEach((_, index) => {
                        const dot = document.createElement('div');
                        dot.classList.add('dot');
                        if (index === 0) dot.classList.add('active');
                        dot.addEventListener('click', () => {
                            const cardWidth = projectCards[0].offsetWidth + parseInt(getComputedStyle(carousel).gap);
                            carousel.scrollTo({
                                left: index * cardWidth,
                                behavior: 'smooth'
                            });
                        });
                        dotsContainer.appendChild(dot);
                    });
                }
            });
            newCard.style.position = 'relative';
            newCard.appendChild(deleteBtn);

            // Scroll to new card
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Recreate dots
            const dotsContainer = document.getElementById('carousel-dots');
            const projectCards = carousel.querySelectorAll('.experience-card');
            dotsContainer.innerHTML = '';
            projectCards.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === projectCards.length - 1) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    const cardWidth = projectCards[0].offsetWidth + parseInt(getComputedStyle(carousel).gap);
                    carousel.scrollTo({
                        left: index * cardWidth,
                        behavior: 'smooth'
                    });
                });
                dotsContainer.appendChild(dot);
            });
        });
    }

    // Add Award Card
    const addAwardBtn = document.getElementById('add-award-btn');
    if (addAwardBtn) {
        addAwardBtn.addEventListener('click', () => {
            const awardsGrid = document.querySelector('.awards-grid');
            const newCard = document.createElement('div');
            newCard.className = 'experience-card';
            newCard.innerHTML = `
                <div class="exp-header">
                    <div>
                        <h3 data-editable="true">[Award Name / Title]</h3>
                        <p class="company" data-editable="true">[Issuing Organization / Event]</p>
                    </div>
                    <div class="exp-meta" data-editable="true">
                        <p>[Location]</p>
                        <p>[Date Received]</p>
                    </div>
                </div>
                <div class="exp-body" data-editable="true">
                    <p>[Brief description of the award, criteria, or what you did to win it.]</p>
                </div>
            `;
            awardsGrid.appendChild(newCard);

            // Make new card editable
            newCard.querySelectorAll('[data-editable="true"]').forEach(el => {
                el.setAttribute('contenteditable', 'true');
            });

            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-card-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this card';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this award card?')) {
                    newCard.remove();
                }
            });
            newCard.style.position = 'relative';
            newCard.appendChild(deleteBtn);

            // Scroll to new card
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
});
