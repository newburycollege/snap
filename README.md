# Mobile Photo Overlay App

A simple mobile-first camera app for GitHub Pages.

## What it does

- Opens the device camera using `getUserMedia()`.
- Starts with the front/selfie camera where available.
- Allows switching between front and rear cameras.
- Shows a live 4:5 portrait preview.
- Crops the camera image to exactly **1080 × 1350 px** on capture.
- Lets the user switch between different overlays/frames.
- Supports left/right swiping to change overlays.
- Embeds the selected overlay into the final JPEG.
- Provides **Share** using the Web Share API where supported.
- Provides **Save photo** as a normal browser download.

## Setup

The app is designed to run directly from GitHub Pages.

The logo should be stored at:

`/images/logo.png`

Overlay images should be stored in:

`/overlays/`

Overlays should ideally be transparent PNG files at **1080 × 1350 px**.

Camera access requires HTTPS, which GitHub Pages provides automatically.
