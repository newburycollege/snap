# Mobile Photo Overlay App

A simple mobile-first camera app for GitHub Pages.

## What it does

- Opens the device camera using `getUserMedia()`.
- Starts with the front/selfie camera where available.
- Allows switching between front and rear cameras.
- Shows a live 4:5 portrait preview.
- Crops the camera image to exactly **1080 × 1350 px** on capture.
- Lets the user switch between:
  - `overlays/one.png`
  - `overlays/two.png`
  - `overlays/three.png`
- Supports left/right swiping to change overlays.
- Embeds the selected overlay into the final JPEG.
- Provides **Share** using the Web Share API where supported.
- Provides **Save photo** as a normal browser download.

## Add your overlays

Place these three transparent PNG files in the `/overlays` folder:

```text
overlays/
  one.png
  two.png
  three.png
```

For best results, make every overlay exactly **1080 × 1350 px** with transparency where the camera photo should show through.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and the `overlays` folder.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

GitHub Pages uses HTTPS, which is required for browser camera access.

## Important mobile/browser notes

- The user must grant camera permission.
- iPhone/iPad sharing works best in Safari.
- Android sharing works well in modern Chrome-based browsers.
- The Web Share API can open the phone's native share sheet. The websites/apps shown there are controlled by the device; a web page cannot force a particular social network to appear.
- Browser security rules mean a website cannot silently save a photo directly into the phone's Photos/Gallery. The **Save photo** button initiates a download; on some phones the user may then need to save the image from the browser/downloads area.
- If the page is embedded in an iframe, camera access may require additional Permissions Policy configuration. Opening the GitHub Pages site directly is simplest.

## Changing the overlay list

Edit the `overlays` array near the top of `app.js`:

```js
const overlays = [
  { name: "Frame 1", src: "overlays/one.png" },
  { name: "Frame 2", src: "overlays/two.png" },
  { name: "Frame 3", src: "overlays/three.png" },
];
```

You can add more overlays by adding more entries and matching PNG files.


## Small iPhone / Safari layout

The capture button is fixed above the currently visible viewport and respects both the iPhone safe area and Safari browser chrome. On shorter screens the live camera preview is reduced slightly so the frame selector remains accessible.


## Logo

Add the app header logo at:

`images/logo.png`

The header now uses this image instead of the previous text title. A transparent PNG is recommended.

## Share message

When supported by the device's native Web Share sheet, the app shares the finished image with the text:

`Preparing for the future! @newburycollege #CareersNotCourses`
