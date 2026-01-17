// Toggle mobile menu
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Smooth scrolling for navigation links
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const navHeight = document.querySelector('nav').offsetHeight;
        const targetPosition = element.offsetTop - navHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Update active nav item on scroll
function updateActiveNav() {
    const sections = ['about', 'experience', 'projects', 'skills'];
    const navHeight = document.querySelector('nav').offsetHeight;
    const scrollPosition = window.scrollY + navHeight + 100;

    // Remove all active classes
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });

    // Find current section
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && scrollPosition >= section.offsetTop) {
            const navLink = document.getElementById('nav-' + sections[i]);
            if (navLink) {
                navLink.classList.add('active');
            }
            break;
        }
    }
}

// Add scroll effect to navigation
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
        nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.7)';
    } else {
        nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
    }

    // Update active navigation item
    updateActiveNav();
});

// Initial check for active section
document.addEventListener('DOMContentLoaded', () => {
    updateActiveNav();
});
