# Static Portfolio Template
Made by Kyumin Kim

This is a lightweight, responsive static portfolio template designed for researchers, developers, and photographers. It is built using pure HTML, CSS, and Vanilla JavaScript, requiring no build tools or complex frameworks.

## Features
- **About**: Minimalist introduction and resume section.
- **Work**: Showcase for publications, patents, and projects with dynamic filtering.
- **Photo**: High-resolution gallery powered by Cloudinary API integration.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices.

## Project Structure
- `index.html`: Home page with personal introduction and background.
- `work.html` / `photo.html`: Dedicated pages for achievements and gallery.
- `styles.css`: Custom modern styling and responsive layout.
- `main.js`: Handles data fetching, UI filtering, and modal interactions.
- `data/`: JSON files for easy content management.

## Setup & Customization

### 1. Local Preview
Since the project fetches data from JSON files, you need to run it via a local server to avoid CORS issues.
```bash
npx serve .
```

### 2. Update Content
You can update your data without touching the HTML structure by editing the JSON files in the `data/` folder.

- **Work Data**: Edit `data/work.json`. Supports types: `publication`, `patent`, and `project`.
- **Photo Data**: Edit `data/photos.json`. Update image URLs and metadata (location, camera, tags).

### 3. Image Integration
The photo gallery is designed to work with **Cloudinary**. 
1. Upload your images to Cloudinary.
2. Copy the URLs into `data/photos.json`.
3. Use Cloudinary's transformation parameters in the `url` field for optimized thumbnails.

## Deployment
This template is ready for **GitHub Pages**.
1. Push this folder to your GitHub repository.
2. Go to `Settings > Pages`.
3. Select the `main` branch and `/root` folder, then save.

## License
Created and maintained by Kyumin Kim. Feel free to use and customize this as your personal portfolio.
