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
- `tools/photos/`: Photo management scripts and local-only upload configs.

## Setup & Customization

### 1. Local Preview
Since the project fetches data from JSON files, you need to run it via a local server to avoid CORS issues.
```bash
npx serve .
```

### 2. Update Content
You can update your data without touching the HTML structure by editing the JSON files in the `data/` folder.

- **Work Data**: Edit `data/work.json`. Supports types: `publication`, `patent`, and `project`. Use `links` for multiple buttons:
  ```json
  "links": [
    { "label": "Link", "url": "https://example.com" },
    { "label": "PDF", "url": "data/paper.pdf" },
    { "label": "Code", "url": "https://github.com/user/repo" }
  ]
  ```
  You can also use direct fields such as `"link"`, `"pdf"`, and `"code"`.
- **Photo Data**: Edit `data/photos.json`. Update image URLs and metadata (location, camera, tags).

### 3. Photo Upload & Sync
The photo gallery uses **Cloudinary** URLs stored in `data/photos.json`.

One-time setup:
1. Fill in `tools/photos/cloudinary_config.py`: `cloud_name`, `api_key`, and `api_secret` from the Cloudinary dashboard.
2. Set `tools/photos/upload_config.json`: `upload_folder`, `city`, `country`, and `tags` for the photo batch you want to upload.

Update workflow:
1. Put the photos for one location/batch in the folder listed in `upload_config.json`.
2. Optional: compress large files before upload.
   ```powershell
   python .\tools\photos\compress_images.py .\tools\photos\upload_config.json
   ```
3. Upload the batch to Cloudinary with shared city/country/tag metadata.
   ```powershell
   python .\tools\photos\upload_to_cloudinary.py .\tools\photos\upload_config.json
   ```
4. Regenerate `data/photos.json` from Cloudinary.
   ```powershell
   python .\tools\photos\sync_cloudinary.py
   ```
5. Check the gallery locally.
   ```powershell
   npx serve .
   ```

Notes:
- `shotAt` and `camera` are read from EXIF when available.
- `location` is saved as `city, country` from the upload config.
- `city` and `country` are also added as Cloudinary tags, along with the tags in the config.
- `tools/photos/cloudinary_config.py` and `tools/photos/upload_config.json` are ignored by Git because they contain local paths or secrets.

## Deployment
This template is ready for **GitHub Pages**.
1. Push this folder to your GitHub repository.
2. Go to `Settings > Pages`.
3. Select the `main` branch and `/root` folder, then save.

## License
Created and maintained by Kyumin Kim. Feel free to use and customize this as your personal portfolio.
