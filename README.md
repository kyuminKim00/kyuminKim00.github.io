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

1. Fill in `tools/photos/cloudinary_config.py` with `cloud_name`, `api_key`, and `api_secret` from Cloudinary.
2. Copy `tools/photos/upload_config.example.json` to `tools/photos/upload_config.json` and set the photo folder and batch metadata:

   ```json
   {
     "upload_folder": "C:\\Photos\\Cheonan",
     "city": "Cheonan",
     "country": "Korea",
     "tags": ["cheonan", "korea", "landscape"]
   }
   ```

Run the complete workflow with one command and one JSON argument:

```powershell
python .\tools\photos\photo_pipeline.py .\tools\photos\upload_config.json
```

The pipeline automatically:

1. Compresses images larger than 10 MB in the configured folder.
2. Reads the camera and capture date from EXIF.
3. Uploads every JPG, JPEG, and PNG to Cloudinary with the configured location and tags.
4. Regenerates `data/photos.json` from Cloudinary.
5. Looks up coordinates for new locations and caches them in `data/photo-locations.json`.

Existing coordinates are reused, so the geocoding service is only called for new locations. To use a different compression limit, add `--target-mb`, for example `--target-mb 8`.

Notes:
- `shotAt` and `camera` are read from EXIF when available.
- `location` is saved as `city, country` from the upload config.
- `city` and `country` are also added as Cloudinary tags, along with the tags in the config.
- Compression updates oversized source images in place before upload.
- `tools/photos/cloudinary_config.py` and `tools/photos/upload_config.json` are ignored by Git because they contain local paths or secrets.

## Deployment
This template is ready for **GitHub Pages**.
1. Push this folder to your GitHub repository.
2. Go to `Settings > Pages`.
3. Select the `main` branch and `/root` folder, then save.

## License
Created and maintained by Kyumin Kim. Feel free to use and customize this as your personal portfolio.
